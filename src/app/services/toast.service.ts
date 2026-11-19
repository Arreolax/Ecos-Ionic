import { Injectable, inject } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  checkmarkCircleOutline,
  closeCircleOutline,
  alertCircleOutline,
  informationCircleOutline,
  closeOutline,
} from 'ionicons/icons';

export interface AppToastOptions {
  message: string;
  color?: 'success' | 'danger' | 'warning' | 'primary' | 'medium';
  duration?: number;
  position?: 'top' | 'bottom' | 'middle';
  icon?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private toastCtrl = inject(ToastController);

  private currentToast: HTMLIonToastElement | null = null;
  private presentingPromise: Promise<void> = Promise.resolve();
  private lastMessage: string = '';
  private lastMessageTime: number = 0;

  constructor() {
    addIcons({
      checkmarkCircleOutline,
      closeCircleOutline,
      alertCircleOutline,
      informationCircleOutline,
      closeOutline,
    });
  }

  /**
   * Muestra un toast garantizando que nunca se sobreponga con otro.
   * Si ya hay uno visible, lo cierra limpiamente antes de presentar el nuevo.
   */
  async show(options: AppToastOptions): Promise<void> {
    this.presentingPromise = this.presentingPromise
      .then(() => this.presentToast(options))
      .catch((err) => {
        console.warn('[ToastService] Error al mostrar toast:', err);
      });

    return this.presentingPromise;
  }

  private async presentToast(options: AppToastOptions): Promise<void> {
    const now = Date.now();

    // Evita duplicar el mismo mensaje en ráfaga (menos de 1.5s)
    if (this.lastMessage === options.message && now - this.lastMessageTime < 1500) {
      return;
    }
    this.lastMessage = options.message;
    this.lastMessageTime = now;

    // Si ya existe un toast activo en pantalla, descartarlo antes de abrir el nuevo
    if (this.currentToast) {
      try {
        await this.currentToast.dismiss();
      } catch (_) {
        // Ignorar si ya fue cerrado por tiempo
      }
      this.currentToast = null;
    }

    // Ícono predeterminado según el tipo de alerta
    let icon = options.icon;
    if (!icon) {
      switch (options.color) {
        case 'success':
          icon = 'checkmark-circle-outline';
          break;
        case 'danger':
          icon = 'close-circle-outline';
          break;
        case 'warning':
          icon = 'alert-circle-outline';
          break;
        default:
          icon = 'information-circle-outline';
          break;
      }
    }

    const toast = await this.toastCtrl.create({
      message: options.message,
      duration: options.duration ?? 3000,
      position: options.position ?? 'top',
      color: options.color ?? 'primary',
      icon,
      cssClass: 'custom-single-toast',
      buttons: [
        {
          icon: 'close-outline',
          role: 'cancel',
        },
      ],
    });

    this.currentToast = toast;

    toast.onDidDismiss().then(() => {
      if (this.currentToast === toast) {
        this.currentToast = null;
      }
    });

    await toast.present();
  }

  async success(message: string, position: 'top' | 'bottom' = 'top', duration = 3000): Promise<void> {
    return this.show({ message, color: 'success', position, duration });
  }

  async error(message: string, position: 'top' | 'bottom' = 'top', duration = 3500): Promise<void> {
    return this.show({ message, color: 'danger', position, duration });
  }

  async warning(message: string, position: 'top' | 'bottom' = 'top', duration = 3500): Promise<void> {
    return this.show({ message, color: 'warning', position, duration });
  }

  async info(message: string, position: 'top' | 'bottom' = 'top', duration = 3000): Promise<void> {
    return this.show({ message, color: 'primary', position, duration });
  }

  async dismiss(): Promise<void> {
    if (this.currentToast) {
      try {
        await this.currentToast.dismiss();
      } catch (_) {}
      this.currentToast = null;
    }
  }
}

