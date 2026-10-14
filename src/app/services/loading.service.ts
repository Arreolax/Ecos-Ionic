import { Injectable } from '@angular/core';
import { LoadingController, ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  private loading: HTMLIonLoadingElement | null = null;

  constructor(
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {}

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
    const toast = await this.toastCtrl.create({
      message,
      duration: 3500,
      position: 'top',
      color: success ? 'success' : 'danger',
      icon: success ? 'checkmark-circle-outline' : 'close-circle-outline',
    });
    await toast.present();
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

