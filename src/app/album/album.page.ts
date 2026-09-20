import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonFab,
  IonFabButton,
  IonIcon,
  IonButtons,
  IonBackButton,
  IonButton,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  ActionSheetController,
  AlertController,
  LoadingController,
  ToastController,
} from '@ionic/angular';
import { ViewWillEnter } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  camera,
  trash,
  close,
  informationCircleOutline,
  imagesOutline,
  addOutline,
  cameraOutline,
} from 'ionicons/icons';
import type { UserPhoto } from '../services/photo.service';
import { PhotoService } from '../services/photo.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-album',
  templateUrl: './album.page.html',
  styleUrls: ['./album.page.scss'],
  imports: [
    CommonModule,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonFab,
    IonFabButton,
    IonIcon,
    IonButtons,
    IonBackButton,
    IonButton,
    IonSpinner,
    IonRefresher,
    IonRefresherContent,
  ],
})
export class AlbumPage implements OnInit, ViewWillEnter {
  public photoService = inject(PhotoService);
  private authService = inject(AuthService);
  private actionSheetController = inject(ActionSheetController);
  private alertCtrl = inject(AlertController);
  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);
  private router = inject(Router);

  constructor() {
    addIcons({
      camera,
      trash,
      close,
      informationCircleOutline,
      imagesOutline,
      addOutline,
      cameraOutline,
    });
  }

  async ngOnInit() {
    // ionViewWillEnter se encarga de cargar las fotos
  }

  async ionViewWillEnter() {
    // Asegurar que la sesión almacenada ya se cargó antes de pedir las fotos
    await this.authService.isAuthenticated();
    await this.photoService.loadSaved();
  }

  /**
   * Arrastrar para recargar fotos desde el servidor.
   */
  async handleRefresh(event: any) {
    try {
      await this.photoService.loadSaved();
    } finally {
      event.target.complete();
    }
  }

  /**
   * Navega a la pantalla de captura de cámara.
   */
  goToCamera() {
    this.router.navigate(['/tabs/camera']);
  }

  /**
   * Menú contextual de opciones al pulsar una foto.
   */
  async showActionSheet(photo: UserPhoto, position: number) {
    const actionSheet = await this.actionSheetController.create({
      header: photo.title || 'Opciones de Fotografía',
      subHeader: photo.created_at ? `Fecha: ${photo.created_at}` : undefined,
      buttons: [
        {
          text: 'Ver Detalles',
          icon: 'information-circle-outline',
          handler: () => {
            this.showPhotoDetails(photo);
          },
        },
        {
          text: 'Eliminar Foto',
          role: 'destructive',
          icon: 'trash',
          handler: () => {
            this.confirmDeletePhoto(photo, position);
          },
        },
        {
          text: 'Cancelar',
          icon: 'close',
          role: 'cancel',
        },
      ],
    });
    await actionSheet.present();
  }

  /**
   * Muestra el modal con título, descripción y fecha de la foto.
   */
  private async showPhotoDetails(photo: UserPhoto) {
    const alert = await this.alertCtrl.create({
      header: photo.title || 'Detalles de la Fotografía',
      subHeader: photo.created_at ? `Subida el: ${photo.created_at}` : undefined,
      message: photo.description ? photo.description : 'Esta fotografía no cuenta con notas adicionales.',
      buttons: ['Cerrar'],
    });
    await alert.present();
  }

  /**
   * Confirma y solicita la eliminación de la foto al backend PHP.
   */
  private async confirmDeletePhoto(photo: UserPhoto, position: number) {
    const alert = await this.alertCtrl.create({
      header: '¿Eliminar fotografía?',
      message: 'Esta acción borrará la foto de la base de datos y del servidor permanentemente.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            const loading = await this.loadingCtrl.create({
              message: 'Eliminando fotografía...',
            });
            await loading.present();

            try {
              const res = await this.photoService.deletePhoto(photo, position);
              this.presentToast(res.message || 'Foto eliminada con éxito.', 'success');
            } catch (error: any) {
              this.presentToast(error.message || 'Error al eliminar la foto.', 'danger');
            } finally {
              await loading.dismiss();
            }
          },
        },
      ],
    });
    await alert.present();
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
