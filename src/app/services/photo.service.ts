import { Injectable, inject, signal, effect } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import type { Photo } from '@capacitor/camera';
import { Filesystem } from '@capacitor/filesystem';
import { Platform } from '@ionic/angular';
import axios from 'axios';
import { AuthService } from './auth.service';

export interface UserPhoto {
  id?: number | string;
  user_id?: number | string;
  file_name?: string;
  file_path?: string;
  title?: string | null;
  description?: string | null;
  created_at?: string;
  filepath: string;
  webviewPath?: string;
}

export interface PhotoUploadResponse {
  success: boolean;
  message: string;
  url?: string;
}

export interface PhotoDeleteResponse {
  success: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class PhotoService {
  private platform = inject(Platform);
  private authService = inject(AuthService);

  private baseUrl = 'http://localhost/ecos-ionic/';
  private uploadUrl = 'http://localhost/ecos-ionic/upload_photo.php';
  private getPhotosUrl = 'http://localhost/ecos-ionic/get_photos.php';
  private deletePhotoUrl = 'http://localhost/ecos-ionic/delete_photo.php';

  public photos = signal<UserPhoto[]>([]);
  public isLoading = signal<boolean>(false);

  constructor() {
    // Si el usuario cierra sesión, limpiar las fotos en memoria
    effect(() => {
      const user = this.authService.currentUser();
      if (!user) {
        this.photos.set([]);
      }
    });
  }

  /**
   * Carga las fotos del usuario actual desde la base de datos MySQL (Backend PHP).
   */
  public async loadSaved(): Promise<void> {
    let user = this.authService.currentUser();
    if (!user) {
      await this.authService.loadStoredUser();
      user = this.authService.currentUser();
    }

    if (!user || !user.id) {
      this.photos.set([]);
      return;
    }

    this.isLoading.set(true);

    try {
      const response = await axios.get<{ success: boolean; data: any[]; message?: string }>(
        `${this.getPhotosUrl}?user_id=${encodeURIComponent(user.id)}`
      );

      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        const mappedPhotos: UserPhoto[] = response.data.data.map((item: any) => {
          const filePath = item.file_path || '';
          const fullWebviewPath = filePath.startsWith('http')
            ? filePath
            : `${this.baseUrl}${filePath}`;

          return {
            id: item.id,
            user_id: item.user_id,
            file_name: item.file_name,
            file_path: filePath,
            title: item.title ?? null,
            description: item.description ?? null,
            created_at: item.created_at,
            filepath: filePath,
            webviewPath: fullWebviewPath,
          };
        });

        this.photos.set(mappedPhotos);
      } else {
        this.photos.set([]);
      }
    } catch (error) {
      console.error('Error al cargar fotos desde el servidor:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Abre la cámara del dispositivo para capturar una foto.
   */
  public async takePhoto(): Promise<Photo | null> {
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        quality: 90,
      });
      return photo;
    } catch (error: any) {
      if (error?.message?.includes('User cancelled') || error?.message?.includes('cancelled')) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Sube la foto capturada al backend en PHP vinculándola al usuario actual.
   */
  public async uploadCapturedPhoto(
    photo: Photo,
    title: string,
    description: string
  ): Promise<PhotoUploadResponse> {
    const user = this.authService.currentUser();
    if (!user || !user.id) {
      throw new Error('Debes iniciar sesión para subir fotografías.');
    }

    if (!title || !title.trim()) {
      throw new Error('El título de la fotografía es obligatorio.');
    }

    if (!description || !description.trim()) {
      throw new Error('La descripción de la fotografía es obligatoria.');
    }

    const blob = await this.getBlobFromPhoto(photo);
    const formData = new FormData();
    const fileName = `photo_${Date.now()}.jpg`;

    formData.append('image', blob, fileName);
    formData.append('user_id', String(user.id));
    formData.append('title', title.trim());
    formData.append('description', description.trim());

    try {
      // Axios con FormData detecta y añade automáticamente los boundaries multipart correctos
      const response = await axios.post<PhotoUploadResponse>(this.uploadUrl, formData);

      if (response.data && response.data.success) {
        // Recargar las fotos desde el servidor para obtener el nuevo ID y fecha
        await this.loadSaved();
        return response.data;
      } else {
        throw new Error(response.data?.message || 'Error al guardar la fotografía en el servidor.');
      }
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        error.message ||
        'Error de conexión con el servidor al subir la foto.';
      throw new Error(msg);
    }
  }

  /**
   * Captura y sube directamente una foto a la galería del usuario.
   */
  public async addNewToGallery(
    title: string,
    description: string
  ): Promise<PhotoUploadResponse | null> {
    const photo = await this.takePhoto();
    if (!photo) {
      return null;
    }
    return await this.uploadCapturedPhoto(photo, title, description);
  }

  /**
   * Elimina la foto tanto de la base de datos MySQL como del disco del servidor PHP.
   */
  public async deletePhoto(photo: UserPhoto, position?: number): Promise<PhotoDeleteResponse> {
    const user = this.authService.currentUser();
    if (!user || !user.id) {
      throw new Error('Debes iniciar sesión para eliminar fotografías.');
    }

    if (!photo.id) {
      throw new Error('Identificador de foto inválido.');
    }

    try {
      const response = await axios.post<PhotoDeleteResponse>(
        this.deletePhotoUrl,
        {
          photo_id: photo.id,
          user_id: user.id,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data && response.data.success) {
        // Actualizar el signal reactivo eliminando la foto
        this.photos.update((photos) => photos.filter((p) => p.id !== photo.id));
        return response.data;
      } else {
        throw new Error(response.data?.message || 'Error al eliminar la foto en el servidor.');
      }
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        error.message ||
        'Error al comunicar la eliminación al servidor.';
      throw new Error(msg);
    }
  }

  /**
   * Convierte la foto de Capacitor a un Blob listo para FormData.
   */
  public async getBlobFromPhoto(photo: Photo): Promise<Blob> {
    if (photo.webPath) {
      try {
        const response = await fetch(photo.webPath);
        return await response.blob();
      } catch (e) {
        console.warn('Fallo al obtener blob desde webPath, probando alternativa...', e);
      }
    }

    if (this.platform.is('hybrid') && photo.path) {
      const file = await Filesystem.readFile({ path: photo.path });
      const base64Data = typeof file.data === 'string' ? file.data : '';
      return this.b64toBlob(base64Data, 'image/jpeg');
    }

    if (photo.base64String) {
      return this.b64toBlob(photo.base64String, 'image/jpeg');
    }

    throw new Error('No se pudo convertir la imagen capturada para subirla.');
  }

  /**
   * Convierte base64 a Blob binario.
   */
  private b64toBlob(b64Data: string, contentType = 'image/jpeg', sliceSize = 512): Blob {
    const cleanB64 = b64Data.includes(',') ? b64Data.split(',')[1] : b64Data;
    const byteCharacters = atob(cleanB64);
    const byteArrays: Uint8Array[] = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    return new Blob(byteArrays as any[], { type: contentType });
  }

  /**
   * Limpia manualmente las fotos cargadas en el estado del cliente.
   */
  public clearPhotos(): void {
    this.photos.set([]);
  }
}
