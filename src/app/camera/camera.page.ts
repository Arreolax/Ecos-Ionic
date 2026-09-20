import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonItem,
  IonInput,
  IonTextarea,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  LoadingController,
  ToastController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  camera,
  cameraOutline,
  imageOutline,
  cloudUploadOutline,
  refreshOutline,
  closeOutline,
  checkmarkCircleOutline,
} from 'ionicons/icons';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import type { Photo } from '@capacitor/camera';
import { PhotoService } from '../services/photo.service';

@Component({
  selector: 'app-camera',
  templateUrl: './camera.page.html',
  styleUrls: ['./camera.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonItem,
    IonInput,
    IonTextarea,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
  ],
})
export class CameraPage {
  private photoService = inject(PhotoService);
  private router = inject(Router);
  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);

  public capturedPhoto = signal<Photo | null>(null);
  public previewUrl = signal<string | null>(null);

  public title: string = '';
  public description: string = '';

  constructor() {
    addIcons({
      camera,
      cameraOutline,
      imageOutline,
      cloudUploadOutline,
      refreshOutline,
      closeOutline,
      checkmarkCircleOutline,
    });
  }

  /**
   * Abre la cámara del dispositivo para capturar una fotografía.
   */
  async openCamera() {
    await this.capture(CameraSource.Camera);
  }

  /**
   * Abre la galería del dispositivo para seleccionar una foto existente.
   */
  async openGallery() {
    await this.capture(CameraSource.Photos);
  }

  private async capture(source: CameraSource) {
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: source,
        quality: 90,
      });

      if (photo) {
        this.capturedPhoto.set(photo);
        this.previewUrl.set(photo.webPath || null);
      }
    } catch (error: any) {
      if (!error?.message?.includes('cancelled') && !error?.message?.includes('User cancelled')) {
        this.presentToast('Error al capturar la imagen: ' + (error.message || error), 'danger');
      }
    }
  }

  /**
   * Descarta la imagen actual y reinicia los campos.
   */
  discardPhoto() {
    this.capturedPhoto.set(null);
    this.previewUrl.set(null);
    this.title = '';
    this.description = '';
  }

  /**
   * Sube la fotografía capturada junto al título y descripción al backend PHP.
   */
  async saveToAlbum() {
    const photo = this.capturedPhoto();
    if (!photo) {
      this.presentToast('Por favor captura o selecciona una fotografía primero.', 'warning');
      return;
    }

    if (!this.title || !this.title.trim()) {
      this.presentToast('El título del recuerdo es obligatorio.', 'warning');
      return;
    }

    if (!this.description || !this.description.trim()) {
      this.presentToast('La descripción o nota del recuerdo es obligatoria.', 'warning');
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Guardando fotografía en el servidor...',
    });
    await loading.present();

    try {
      const res = await this.photoService.uploadCapturedPhoto(
        photo,
        this.title.trim(),
        this.description.trim()
      );

      this.presentToast(res.message || 'Fotografía guardada con éxito en tu álbum.', 'success');
      this.discardPhoto();
      // Redirigir a la pantalla de Álbum para ver la nueva foto
      this.router.navigate(['/tabs/album']);
    } catch (error: any) {
      this.presentToast(error.message || 'Error al guardar la fotografía en el servidor.', 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  private async presentToast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'bottom',
      color,
    });
    await toast.present();
  }
}
