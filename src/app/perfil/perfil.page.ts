import { Component, OnInit, ChangeDetectorRef } from "@angular/core";
import { CameraSource } from '@capacitor/camera';
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonCard,
  IonList,
  IonItem,
  IonLabel,
  IonModal,
  IonInput,
  IonSpinner,
  ToastController,
  AlertController,
  IonGrid,
  IonRow,
  IonCol,
  IonPopover,
  IonChip,
  ViewWillEnter,
  IonFooter,
} from "@ionic/angular";
import { addIcons } from "ionicons";
import {
  personOutline,
  mailOutline,
  shieldCheckmarkOutline,
  createOutline,
  trashOutline,
  logOutOutline,
  closeOutline,
  saveOutline,
  lockClosedOutline,
  personCircleOutline,
  callOutline,
  atOutline,
  bookOutline,
  book,
  ellipsisVertical,
  imagesOutline,
  serverOutline,
  globeOutline,
  cameraOutline,
  camera, imageOutline
} from "ionicons/icons";

import { AuthService } from "../services/auth.service";
import { PhotoService } from "../services/photo.service";
import { NotesService } from "../services/notes.service";
import { LoadingService } from "../services/loading.service";
import { Preferences } from "@capacitor/preferences";

@Component({
  selector: "app-perfil",
  templateUrl: "./perfil.page.html",
  styleUrls: ["./perfil.page.scss"],
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
    IonCard,
    IonList,
    IonItem,
    IonLabel,
    IonModal,
    IonInput,
    IonSpinner,
    IonGrid,
    IonRow,
    IonCol,
    IonPopover,
    RouterLink,
    IonChip,
    IonFooter,
  ],
})
export class PerfilPage implements OnInit, ViewWillEnter {
  isEditModalOpen: boolean = false;
  isSaving: boolean = false;
  isDeleting: boolean = false;
  isSavingConfig: boolean = false;

  totalPhotos: number = 0;
  totalNotes: number = 0;

  editData = {
    name: "",
    username: "",
    email: "",
    telefono: "",
    password: "",
  };

  // Objeto para manejar la IP y puerto desde el Perfil
  serverConfig = {
    ip: "",
    port: "3304",
  };

  selectedPhotoPreview: string | undefined = undefined;
  selectedPhotoBlob: Blob | null = null;

  isPhotoSourceModalOpen: boolean = false;

  constructor(
    public authService: AuthService,
    private photoService: PhotoService,
    private notesService: NotesService,
    private router: Router,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private cdr: ChangeDetectorRef,
    private loadingService: LoadingService,
  ) {
    addIcons({
      personOutline,
      mailOutline,
      shieldCheckmarkOutline,
      createOutline,
      trashOutline,
      logOutOutline,
      closeOutline,
      saveOutline,
      lockClosedOutline,
      personCircleOutline,
      callOutline,
      atOutline,
      bookOutline,
      book,
      ellipsisVertical,
      imagesOutline,
      serverOutline,
      globeOutline,
      cameraOutline,
      camera, imageOutline
    });
  }

  ngOnInit() {
    this.loadStats();
    this.loadServerConfig();
  }

  ionViewWillEnter() {
    this.loadStats();
    this.loadServerConfig();
  }

  // Cargar la configuración de IP y puerto guardada
  async loadServerConfig() {
    const { value } = await Preferences.get({ key: "serverConfig" });
    if (value) {
      this.serverConfig = JSON.parse(value);
      this.cdr.detectChanges();
    }
  }

  // Guardar la nueva IP y puerto
  async saveServerConfig() {
    if (!this.serverConfig.ip.trim()) {
      await this.showToast(
        "La IP del servidor no puede estar vacía.",
        "warning",
      );
      return;
    }

    this.isSavingConfig = true;
    this.cdr.detectChanges();

    await this.loadingService.show('Guardando configuración...');

    try {
      await Preferences.set({
        key: "serverConfig",
        value: JSON.stringify(this.serverConfig),
      });
      await this.loadingService.dismissWithResult(
        "Origen de datos guardado correctamente.",
        true,
      );
    } catch (error) {
      await this.loadingService.dismissWithResult("Error al guardar la configuración.", false);
    } finally {
      this.isSavingConfig = false;
      this.cdr.detectChanges();
    }
  }

  openPhotoSourceModal() {
  this.isPhotoSourceModalOpen = true;
  this.cdr.detectChanges();
}

closePhotoSourceModal() {
  this.isPhotoSourceModalOpen = false;
  this.cdr.detectChanges();
}

  async loadStats() {
    await this.photoService.loadSaved();
    this.totalPhotos = this.photoService.photos().length;

    const user = this.authService.currentUser();
    if (user && user.id) {
      this.notesService.getNotes(Number(user.id)).subscribe({
        next: (notes) => {
          this.totalNotes = notes.length;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error("Error al cargar cantidad de notas", err);
          this.totalNotes = 0;
          this.cdr.detectChanges();
        },
      });
    }
  }
  

  async showToast(message: string, color: "success" | "danger" | "warning") {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3500,
      position: "top",
      color,
    });
    await toast.present();
  }

  openEditModal() {
    const user = this.authService.currentUser();
    if (user) {
      this.editData = {
        name: user.name,
        username: user.username || "",
        email: user.email,
        telefono: user.telefono || "",
        password: "",
      };
      this.selectedPhotoPreview = undefined; // <-- NUEVO
      this.selectedPhotoBlob = null; // <-- NUEVO
      this.isEditModalOpen = true;
      this.cdr.detectChanges();
    }
  }

  closeEditModal() {
    this.isEditModalOpen = false;
    this.cdr.detectChanges();
  }

  async selectProfilePhoto(sourceType: 'CAMERA' | 'PHOTOS') {
  this.closePhotoSourceModal(); // Cerramos el modal inmediatamente
  
  try {
    const source = sourceType === 'CAMERA' ? CameraSource.Camera : CameraSource.Photos;
    const photo = await this.photoService.takePhoto(source); 
    
    if (photo) {
      this.selectedPhotoPreview = photo.webPath || photo.dataUrl;
      this.selectedPhotoBlob = await this.photoService.getBlobFromPhoto(photo);
      this.cdr.detectChanges();
    }
  } catch (error) {
    console.error('Error al seleccionar foto', error);
  }
}

  // Función para obtener la URL de la foto de perfil en la vista principal
  getProfilePhotoUrl(user: any): string | null {
    if (user && user.profile_photo_path) {
      const ip = this.serverConfig?.ip || 'localhost';
      const port = this.serverConfig?.port || '80';
      // Retorna la ruta completa concatenando tu backend
      return `http://${ip}:${port}/ecos-ionic/${user.profile_photo_path}`;
    }
    return null;
  }

  async saveProfile() {
    const user = this.authService.currentUser();
    if (!user) return;

    if (
      !this.editData.name.trim() ||
      !this.editData.username.trim() ||
      !this.editData.email.trim() ||
      !this.editData.telefono.trim()
    ) {
      await this.showToast(
        "El nombre, usuario, correo y teléfono son obligatorios.",
        "warning",
      );
      return;
    }

    this.isSaving = true;
    this.cdr.detectChanges();

    await this.loadingService.show('Guardando perfil...');

    try {
      const response = await this.authService.updateProfile(
        user.id,
        this.editData.name.trim(),
        this.editData.username.trim(),
        this.editData.email.trim(),
        this.editData.telefono.trim(),
        this.editData.password.trim() || undefined,
        this.selectedPhotoBlob, // <-- NUEVO: Pasamos la imagen
      );

      if (response.success) {
        this.closeEditModal();
        await this.loadingService.dismissWithResult(
          response.message || "Perfil actualizado con éxito.",
          true,
        );
      } else {
        await this.loadingService.dismissWithResult(
          response.message || "Error al actualizar perfil.",
          false,
        );
      }
    } catch (error: any) {
      await this.loadingService.dismissWithResult("Error al conectar con el servidor.", false);
    } finally {
      this.isSaving = false;
      this.cdr.detectChanges();
    }
  }

  async confirmDeleteAccount() {
    const user = this.authService.currentUser();
    if (!user) return;

    const alert = await this.alertCtrl.create({
      header: "¿Eliminar cuenta?",
      subHeader: "Esta acción es irreversible",
      message:
        "Se borrarán todos tus datos asociados permanentemente. ¿Deseas continuar?",
      buttons: [
        {
          text: "Cancelar",
          role: "cancel",
        },
        {
          text: "Eliminar",
          role: "destructive",
          handler: () => {
            this.executeDeleteAccount(user.id);
          },
        },
      ],
    });

    await alert.present();
  }

  async executeDeleteAccount(userId: number | string) {
    this.isDeleting = true;
    this.cdr.detectChanges();

    await this.loadingService.show('Eliminando cuenta...');

    try {
      const response = await this.authService.deleteAccount(userId);

      if (response.success) {
        await this.loadingService.dismissWithResult("Cuenta eliminada correctamente.", true);
        this.router.navigate(["/login"]);
      } else {
        await this.loadingService.dismissWithResult(
          response.message || "No se pudo eliminar la cuenta.",
          false,
        );
      }
    } catch (error: any) {
      await this.loadingService.dismissWithResult("Error al conectar con el servidor.", false);
    } finally {
      this.isDeleting = false;
      this.cdr.detectChanges();
    }
  }

  async logout() {
    await this.authService.logout();
    this.router.navigate(["/login"]);
  }
}
