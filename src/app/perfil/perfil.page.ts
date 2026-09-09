import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
  IonCard,
  IonList,
  IonItem,
  IonLabel,
  IonModal,
  IonInput,
  IonSpinner,
  ToastController,
  AlertController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
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
} from 'ionicons/icons';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
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
  ],
})
export class PerfilPage implements OnInit {
  isEditModalOpen: boolean = false;
  isSaving: boolean = false;
  isDeleting: boolean = false;

  editData = {
    name: '',
    username: '',
    email: '',
    telefono: '',
    password: '',
  };

  constructor(
    public authService: AuthService,
    private router: Router,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private cdr: ChangeDetectorRef
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
    });
  }

  ngOnInit() {}

  async showToast(message: string, color: 'success' | 'danger' | 'warning') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3500,
      position: 'top',
      color,
    });
    await toast.present();
  }

  openEditModal() {
    const user = this.authService.currentUser();
    if (user) {
      this.editData = {
        name: user.name,
        username: user.username || '',
        email: user.email,
        telefono: user.telefono || '',
        password: '',
      };
      this.isEditModalOpen = true;
      this.cdr.detectChanges();
    }
  }

  closeEditModal() {
    this.isEditModalOpen = false;
    this.cdr.detectChanges();
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
      await this.showToast('El nombre, usuario, correo y teléfono son obligatorios.', 'warning');
      return;
    }

    this.isSaving = true;
    this.cdr.detectChanges();

    try {
      const response = await this.authService.updateProfile(
        user.id,
        this.editData.name.trim(),
        this.editData.username.trim(),
        this.editData.email.trim(),
        this.editData.telefono.trim(),
        this.editData.password.trim() || undefined
      );

      if (response.success) {
        this.closeEditModal();
        await this.showToast(response.message || 'Perfil actualizado con éxito.', 'success');
      } else {
        await this.showToast(response.message || 'Error al actualizar perfil.', 'danger');
      }
    } catch (error: any) {
      await this.showToast('Error al conectar con el servidor.', 'danger');
    } finally {
      this.isSaving = false;
      this.cdr.detectChanges();
    }
  }

  async confirmDeleteAccount() {
    const user = this.authService.currentUser();
    if (!user) return;

    const alert = await this.alertCtrl.create({
      header: '¿Eliminar cuenta?',
      subHeader: 'Esta acción es irreversible',
      message: 'Se borrarán todos tus datos asociados permanentemente. ¿Deseas continuar?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Eliminar',
          role: 'destructive',
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

    try {
      const response = await this.authService.deleteAccount(userId);

      if (response.success) {
        await this.showToast('Cuenta eliminada correctamente.', 'success');
        this.router.navigate(['/login']);
      } else {
        await this.showToast(response.message || 'No se pudo eliminar la cuenta.', 'danger');
      }
    } catch (error: any) {
      await this.showToast('Error al conectar con el servidor.', 'danger');
    } finally {
      this.isDeleting = false;
      this.cdr.detectChanges();
    }
  }
}
