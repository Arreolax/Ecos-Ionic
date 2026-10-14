import { Component, OnInit, inject, computed, signal, ChangeDetectorRef } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute } from "@angular/router";
import { FormsModule } from "@angular/forms";
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonIcon,
  IonButtons,
  IonBackButton,
  IonSpinner,
  ActionSheetController,
  AlertController,
  LoadingController,
  ToastController,
  IonRefresher,
  IonRefresherContent,
  IonModal,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonFooter,
} from "@ionic/angular";
import { ViewWillEnter } from "@ionic/angular";
import { addIcons } from "ionicons";
import {
  trash,
  close,
  informationCircleOutline,
  imagesOutline,
  heart,
  heartOutline,
  pencil,
} from "ionicons/icons";
import type { UserPhoto, Folder } from "../services/photo.service";
import { PhotoService } from "../services/photo.service";
import { AuthService } from "../services/auth.service";
import { LoadingService } from "../services/loading.service";

@Component({
  selector: "app-album-fotos",
  templateUrl: "./album-fotos.page.html",
  styleUrls: ["./album-fotos.page.scss"],
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonIcon,
    IonButtons,
    IonBackButton,
    IonSpinner,
    IonRefresher,
    IonRefresherContent,
    FormsModule,
    IonModal, IonItem, IonLabel, IonInput, IonTextarea, IonSelect, IonSelectOption, IonButton, IonFooter,
  ],
})
export class FolderPhotosPage implements OnInit, ViewWillEnter {
  private route = inject(ActivatedRoute);
  public photoService = inject(PhotoService);
  private authService = inject(AuthService);
  private actionSheetController = inject(ActionSheetController);
  private alertCtrl = inject(AlertController);
  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);
  private loadingService = inject(LoadingService);
  private cdr = inject(ChangeDetectorRef);

  public isEditModalOpen = false;
  public editData: Partial<UserPhoto> = {};
  public availableFolders: Folder[] = [];

  public folderId: string | null = null;
  public folderName = "";

  private localRefresh = signal(0);

  public folderPhotos = computed(() => {
    this.localRefresh();
    
    const allPhotos = this.photoService.photos();
    
    if (this.folderId === '1') {
      return allPhotos;
    }

    if (this.folderId === 'favoritas') {
      return allPhotos.filter(p => p.isFavorite || (p as any).favorite);
    }
    
    if (this.folderId === 'sin-carpeta') {
      return allPhotos.filter(p => !p.folder_id);
    }
    
    return allPhotos.filter(p => String(p.folder_id) === String(this.folderId));
  });

  constructor() {
    addIcons({
      trash,
      close,
      informationCircleOutline,
      imagesOutline,
      heart,
      heartOutline,
      pencil
    });
  }

  public showFolderName(folderId?: string | number | null): boolean {
    if (folderId == null) {
      return false;
    }
    return Number(folderId) > 3;
  }

  ngOnInit() {
    this.folderId = this.route.snapshot.paramMap.get("id");
    const queryName = this.route.snapshot.queryParamMap.get("folderName");

    if (queryName) {
      this.folderName = queryName;
    } else {
      setTimeout(() => {
        const photos = this.folderPhotos();
        this.folderName =
          photos.length > 0 && photos[0].folder_name
            ? photos[0].folder_name
            : this.folderId === "sin-carpeta"
              ? "Sin Carpeta"
              : "Carpeta";
      }, 100);
    }
  }

  async ionViewWillEnter() {
    await this.authService.isAuthenticated();
    await this.photoService.loadSaved();
  }

  async handleRefresh(event: any) {
    try {
      await this.photoService.loadSaved();
    } finally {
      event.target.complete();
    }
  }

  async toggleFavorite(photo: UserPhoto, event: Event) {
    event.stopPropagation();
    if (!photo.id || !photo.user_id || !photo.folder_id) return;

    const previousState = photo.isFavorite;
    
    photo.isFavorite = !photo.isFavorite;

    if ('favorite' in photo) {
      (photo as any).favorite = photo.isFavorite;
    }

    this.localRefresh.update(v => v + 1);

    try {
      await this.photoService.updateFavorite(photo);
      this.presentToast(photo.isFavorite ? 'Añadida a favoritos' : 'Eliminada de favoritos', 'success');
      
    } catch (error: any) {
      photo.isFavorite = previousState;
      if ('favorite' in photo) {
        (photo as any).favorite = previousState;
      }
      this.localRefresh.update(v => v + 1);
      
      this.presentToast(error.message || 'Error al actualizar favorito.', 'danger');
    }
  }

  async showActionSheet(photo: UserPhoto) {
    const actionSheet = await this.actionSheetController.create({
      header: photo.title || "Opciones de Fotografía",
      subHeader: photo.created_at ? `Fecha: ${photo.created_at}` : undefined,
      buttons: [
        {
          text: "Editar Datos",
          icon: "pencil",
          handler: () => {
            setTimeout(() => {
              this.openEditModal(photo);
            }, 300);
          },
        },
        {
          text: "Eliminar Foto",
          role: "destructive",
          icon: "trash",
          handler: () => this.confirmDeletePhoto(photo),
        },
        { text: "Cancelar", icon: "close", role: "cancel" },
      ],
    });
    await actionSheet.present();
  }

  public async openEditModal(photo: UserPhoto) {
    if (this.availableFolders.length === 0) {
      this.availableFolders = await this.photoService.getFolders();
    }
    
    this.editData = { ...photo };
    this.isEditModalOpen = true;

    this.cdr.detectChanges();
  }

  public closeEditModal() {
    this.isEditModalOpen = false;
  }

  public async savePhotoEdits() {
    await this.loadingService.show("Guardando cambios...");
    
    try {
      await this.photoService.updatePhoto(this.editData as UserPhoto);
      
      this.closeEditModal();
      await this.photoService.loadSaved();
      
      await this.loadingService.dismissWithResult("Fotografía actualizada con éxito.", true);
    } catch (error: any) {
      await this.loadingService.dismissWithResult(error.message || "Error al actualizar.", false);
    }
  }

  private async confirmDeletePhoto(photo: UserPhoto) {
    const alert = await this.alertCtrl.create({
      header: "¿Eliminar fotografía?",
      message: "Esta acción borrará la foto permanentemente.",
      buttons: [
        { text: "Cancelar", role: "cancel" },
        {
          text: "Eliminar",
          role: "destructive",
          handler: async () => {
            await this.loadingService.show("Eliminando fotografía...");
            try {
              const res = await this.photoService.deletePhoto(photo);
              await this.loadingService.dismissWithResult(
                res.message || "Foto eliminada con éxito.",
                true,
              );
            } catch (error: any) {
              await this.loadingService.dismissWithResult(
                error.message || "Error al eliminar.",
                false,
              );
            }
          },
        },
      ],
    });
    await alert.present();
  }

  private async presentToast(
    message: string,
    color: "success" | "danger" | "warning" = "success",
  ) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: "bottom",
      color,
    });
    await toast.present();
  }
}