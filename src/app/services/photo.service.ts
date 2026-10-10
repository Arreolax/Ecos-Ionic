import { Injectable, inject, signal, effect } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import type { Photo } from '@capacitor/camera';
import { Filesystem } from '@capacitor/filesystem';
import { Platform, ToastController } from '@ionic/angular';
import axios from 'axios';
import { AuthService } from './auth.service';
import { Preferences } from '@capacitor/preferences';

const AXIOS_TIMEOUT_MS = 10_000;

export interface UserPhoto {
  id?: number | string;
  user_id?: number | string;
  file_name?: string;
  file_path?: string;
  title?: string | null;
  description?: string | null;
  folder_id?: number | string; 
  folder_name?: string | null;
  created_at?: string;
  filepath: string;
  webviewPath?: string;
  isFavorite?: boolean;
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

export interface Folder {
  id: number;
  name: string;
  description?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class PhotoService {
  private platform = inject(Platform);
  private authService = inject(AuthService);
  private toastCtrl = inject(ToastController);

  public photos = signal<UserPhoto[]>([]);
  public isLoading = signal<boolean>(false);

  constructor() {
    effect(() => {
      const user = this.authService.currentUser();
      if (!user) {
        this.photos.set([]);
      }
    });
  }

  private async getBaseUrl(): Promise<string> {
    const { value } = await Preferences.get({ key: 'serverConfig' });
    if (value) {
      const config = JSON.parse(value);
      const ip = config.ip || 'localhost';
      const port = config.port || '80';
      // Construye la URL uniendo IP y puerto
      return `http://${ip}:${port}/ecos-ionic`;
    }
    // Fallback de seguridad
    return 'http://localhost/ecos-ionic';
  }

  public async getFolders(): Promise<Folder[]> {
    try {
      const baseUrl = await this.getBaseUrl();
      const response = await axios.get<{ success: boolean; data: Folder[] }>(
        `${baseUrl}/get_folders.php`,
        { timeout: AXIOS_TIMEOUT_MS }
      );

      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      return [];
    } catch (error: any) {
      console.error('Error al cargar carpetas:', error);
      await this.showToast('No se pudieron cargar las carpetas.', 'warning');
      return [];
    }
  }

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
      const baseUrl = await this.getBaseUrl();
      const response = await axios.get<{ success: boolean; data: any[]; message?: string }>(
        `${baseUrl}/get_photos.php?user_id=${encodeURIComponent(user.id)}`,
        { timeout: AXIOS_TIMEOUT_MS }
      );

      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        const mappedPhotos: UserPhoto[] = response.data.data.map((item: any) => {
          const filePath = item.file_path || '';
          const fullWebviewPath = filePath.startsWith('http')
            ? filePath
            : `${baseUrl}/${filePath}`;

          return {
            id: item.id,
            user_id: item.user_id,
            file_name: item.file_name,
            file_path: filePath,
            title: item.title ?? null,
            description: item.description ?? null,
            folder_id: item.folder_id ?? null,     
            folder_name: item.folder_name ?? null, 
            created_at: item.created_at,
            filepath: filePath,
            webviewPath: fullWebviewPath,
            isFavorite: Number(item.favorite) === 1
          };
        });

        this.photos.set(mappedPhotos);
      } else {
        this.photos.set([]);
      }
    } catch (error: any) {
      console.error('Error al cargar fotos desde el servidor:', error);
      const msg = error.code === 'ECONNABORTED'
        ? 'La carga de fotos tardó demasiado. Verifica tu conexión.'
        : 'No se pudieron cargar las fotos. Verifica tu conexión.';
      await this.showToast(msg, 'warning');
      this.photos.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  // Modifica la función para recibir el parámetro 'source'
  public async takePhoto(source: CameraSource = CameraSource.Camera): Promise<Photo | null> {
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: source, // <-- Usa el parámetro dinámico aquí
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

  public async uploadCapturedPhoto(
    photo: Photo,
    title: string,
    description: string,
    folderId: number
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

    if (!folderId) {
      throw new Error('Debes seleccionar una carpeta para la fotografía.');
    }

    const blob = await this.getBlobFromPhoto(photo);
    const formData = new FormData();
    const fileName = `photo_${Date.now()}.jpg`;

    formData.append('image', blob, fileName);
    formData.append('user_id', String(user.id));
    formData.append('title', title.trim());
    formData.append('description', description.trim());
    formData.append('folder_id', String(folderId));

    try {
      const baseUrl = await this.getBaseUrl();
      const response = await axios.post<PhotoUploadResponse>(
        `${baseUrl}/upload_photo.php`,
        formData,
        { timeout: 30_000 }
      );

      if (response.data && response.data.success) {
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

  public async addNewToGallery(
    title: string,
    description: string,
    folderId: number
  ): Promise<PhotoUploadResponse | null> {
    const photo = await this.takePhoto();
    if (!photo) {
      return null;
    }
    return await this.uploadCapturedPhoto(photo, title, description, folderId);
  }

  public async deletePhoto(photo: UserPhoto, position?: number): Promise<PhotoDeleteResponse> {
    const user = this.authService.currentUser();
    if (!user || !user.id) {
      throw new Error('Debes iniciar sesión para eliminar fotografías.');
    }

    if (!photo.id) {
      throw new Error('Identificador de foto inválido.');
    }

    try {
      const baseUrl = await this.getBaseUrl();
      const response = await axios.post<PhotoDeleteResponse>(
        `${baseUrl}/delete_photo.php`,
        {
          photo_id: photo.id,
          user_id: user.id,
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: AXIOS_TIMEOUT_MS,
        }
      );

      if (response.data && response.data.success) {
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

  public clearPhotos(): void {
    this.photos.set([]);
  }

  public async updateFavorite(photo: UserPhoto): Promise<any> {
    try {
      const baseUrl = await this.getBaseUrl();
      const response = await axios.post(
        `${baseUrl}/update_photo.php`,
        {
          id: photo.id,                     
          user_id: photo.user_id,           
          folder_id: photo.folder_id,       
          title: photo.title,               
          description: photo.description,   
          favorite: photo.isFavorite ? 1 : 0 
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        }
      );

      if (response.data && response.data.success) {
        return response.data;
      } else {
        throw new Error(response.data?.message || 'Error al actualizar favorito.');
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Error de conexión.';
      throw new Error(msg);
    }
  }

  public async updatePhoto(photo: UserPhoto): Promise<any> {
  try {
    const baseUrl = await this.getBaseUrl();
    const response = await axios.post(
      `${baseUrl}/update_photo.php`,
      {
        id: photo.id,                     
        user_id: photo.user_id,           
        folder_id: photo.folder_id,       
        title: photo.title,               
        description: photo.description,   
        favorite: photo.isFavorite ? 1 : 0 
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      }
    );

    if (response.data && response.data.success) {
      return response.data;
    } else {
      throw new Error(response.data?.message || 'Error al actualizar los datos de la foto.');
    }
  } catch (error: any) {
    const msg = error.response?.data?.message || error.message || 'Error de conexión.';
    throw new Error(msg);
  }
}


  private async showToast(message: string, color: 'success' | 'warning' | 'danger' = 'warning'): Promise<void> {
    try {
      const toast = await this.toastCtrl.create({
        message,
        duration: 3500,
        position: 'top',
        color,
      });
      await toast.present();
    } catch (e) {
      console.warn('No se pudo presentar el Toast:', e);
    }
  }
}