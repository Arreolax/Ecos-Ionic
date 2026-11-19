import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
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
  IonSelect,
  IonSelectOption,
  LoadingController,
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
  imagesOutline,
  locateOutline,
} from 'ionicons/icons';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import type { Photo } from '@capacitor/camera';
import { PhotoService } from '../services/photo.service';
import type { Folder } from '../services/photo.service';
import { LoadingService } from '../services/loading.service';
import { ToastService } from '../services/toast.service';

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
    IonSelect,
    IonSelectOption,
    RouterLink,
  ],
})
export class CameraPage {
  private photoService = inject(PhotoService);
  private router = inject(Router);
  private loadingCtrl = inject(LoadingController);
  private toastService = inject(ToastService);
  private loadingService = inject(LoadingService);

  public capturedPhoto = signal<Photo | null>(null);
  public previewUrl = signal<string | null>(null);

  public title: string = '';
  public description: string = '';
  public selectedFolderId: number | null = 3;
  public folders: Folder[] = [];
  public latitude: number | null = null;
  public longitude: number | null = null;

  constructor() {
    addIcons({
      camera,
      cameraOutline,
      imageOutline,
      cloudUploadOutline,
      refreshOutline,
      closeOutline,
      checkmarkCircleOutline,
      imagesOutline,
      locateOutline,
    });

    // Cargar las carpetas al inicializar la página
    this.loadFolders();
  }

  private async loadFolders() {
    this.folders = await this.photoService.getFolders();
  }

  /**
   * Captura foto con ubicación usando PhotoService.
   */
  async captureWithLocation() {
    try {
      const result = await this.photoService.capturePhotoWithLocation();
      const photo = result.photo;
      this.capturedPhoto.set(photo);
      this.previewUrl.set(photo.webPath || null);
      this.latitude = result.latitude;
      this.longitude = result.longitude;
    } catch (error: any) {
      this.presentToast(error.message ?? 'Error al capturar la foto con ubicación.', 'danger');
    }
  }

  // Mantener método existente para captura sin ubicación (opcional)
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
    this.selectedFolderId = 3;
    this.latitude = null;
    this.longitude = null;
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

    if (!this.selectedFolderId) {
      this.presentToast('Por favor selecciona una carpeta para guardar la foto.', 'warning');
      return;
    }

    await this.loadingService.show('Guardando fotografía en el servidor...');

    try {
      const res = await this.photoService.uploadCapturedPhoto(
        photo,
        this.title.trim(),
        this.description.trim(),
        this.selectedFolderId
      );

      this.discardPhoto();
      await this.loadingService.dismissWithResult(
        res.message || 'Fotografía guardada con éxito en tu álbum.',
        true
      );
      // Redirigir a la pantalla de Álbum para ver la nueva foto
      this.router.navigate(['/tabs/album']);
    } catch (error: any) {
      await this.loadingService.dismissWithResult(
        error.message || 'Error al guardar la fotografía en el servidor.',
        false
      );
    }
  }

  private async presentToast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    if (color === 'success') {
      await this.toastService.success(message, 'bottom');
    } else if (color === 'danger') {
      await this.toastService.error(message, 'bottom');
    } else {
      await this.toastService.warning(message, 'bottom');
    }
  }
}
