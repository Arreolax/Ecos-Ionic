import { Injectable, inject } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  private loading: HTMLIonLoadingElement | null = null;
  private loadingCtrl = inject(LoadingController);
  private toastService = inject(ToastService);

  async show(message: string = 'Procesando...'): Promise<void> {
    await this.dismiss();

    this.loading = await this.loadingCtrl.create({
      message,
      spinner: 'crescent',
      cssClass: 'custom-loading',
      backdropDismiss: false,
    });
    await this.loading.present();
  }

  async dismiss(): Promise<void> {
    if (this.loading) {
      try {
        await this.loading.dismiss();
      } catch (_) {
      }
      this.loading = null;
    }
  }

  async showResult(message: string, success: boolean): Promise<void> {
    if (success) {
      await this.toastService.success(message, 'top', 3500);
    } else {
      await this.toastService.error(message, 'top', 3500);
    }
  }

  async dismissWithResult(message: string, success: boolean): Promise<void> {
    await this.dismiss();
    await this.showResult(message, success);
  }

  async wrap<T>(
    loadingMessage: string,
    operation: () => Promise<T>,
    successMessage?: string,
    errorMessage: string = 'Error al conectar con el servidor.'
  ): Promise<T | undefined> {
    await this.show(loadingMessage);
    try {
      const result = await operation();
      await this.dismiss();
      if (successMessage) {
        await this.showResult(successMessage, true);
      }
      return result;
    } catch (error: any) {
      const msg = error?.message || errorMessage;
      await this.dismissWithResult(msg, false);
      throw error;
    }
  }
}

