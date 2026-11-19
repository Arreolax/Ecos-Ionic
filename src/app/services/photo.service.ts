import { Injectable, signal } from '@angular/core';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Preferences } from '@capacitor/preferences';
import { LocationService } from './location.service';

export interface Folder {
  id: number | string;
  name: string;
  description?: string;
}

export interface UserPhoto {
  id?: number | string;
  localId?: string;
  user_id?: number | string | null;
  title?: string;
  description?: string;
  image_path?: string;
  file_path?: string;
  file_name?: string;
  folder_id?: number | string | null;
  folder_name?: string | null;
  created_at?: string;
  url?: string;
  webviewPath?: string;
  isFavorite?: boolean;
  favorite?: boolean;
  syncStatus?: 'local' | 'synced';
  [key: string]: any;
}

@Injectable({ providedIn: 'root' })
export class PhotoService {
  private readonly photosState = signal<UserPhoto[]>([]);
  private readonly loadingState = signal(false);

  constructor(private locationSrv: LocationService) {}

  isLoading(): boolean {
    return this.loadingState();
  }

  photos(): UserPhoto[] {
    return this.photosState();
  }

  async capturePhotoWithLocation(): Promise<{ photo: Photo; latitude: number; longitude: number }> {
    const perm = await this.locationSrv.requestPermission();
    if (perm.location !== 'granted') {
      throw new Error('Permiso de ubicación denegado');
    }

    const pos = await this.locationSrv.getCurrentPosition();
    const photo = await Camera.getPhoto({
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      quality: 90,
    });

    const entry = {
      filePath: photo.path ?? photo.webPath,
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      timestamp: new Date().toISOString(),
    };

    const current = await this.getSavedPhotos();
    current.push(entry as any);
    await this.savePhotos(current);

    return {
      photo,
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
    };
  }

  async getSavedPhotos(): Promise<Array<{ filePath: string; latitude: number; longitude: number; timestamp: string }>> {
    const stored = await this.readPhotosFromStorage();
    return stored as Array<{ filePath: string; latitude: number; longitude: number; timestamp: string }>;
  }

  async loadSaved(): Promise<void> {
    this.loadingState.set(true);
    try {
      const saved = await this.readPhotosFromStorage();
      this.photosState.set(saved.map(photo => this.normalizePhoto(photo)));
    } finally {
      this.loadingState.set(false);
    }
  }

  async getFolders(): Promise<Folder[]> {
    const existing = this.photosState();
    const folderMap = new Map<string, Folder>();

    folderMap.set('1', { id: 1, name: 'Todas las Imagenes' });
    folderMap.set('2', { id: 2, name: 'Favoritas' });
    folderMap.set('3', { id: 3, name: 'Sin Carpeta' });

    for (const photo of existing) {
      const folderId = photo.folder_id ?? 3;
      const folderName = photo.folder_name || 'Sin Carpeta';
      const key = String(folderId);
      if (!folderMap.has(key)) {
        folderMap.set(key, { id: folderId, name: folderName });
      }
    }

    return Array.from(folderMap.values());
  }

  async takePhoto(source: CameraSource): Promise<Photo> {
    return Camera.getPhoto({
      resultType: CameraResultType.Uri,
      source,
      quality: 90,
    });
  }

  async getBlobFromPhoto(photo: Photo): Promise<Blob> {
    if (photo.dataUrl) {
      return this.dataUrlToBlob(photo.dataUrl);
    }

    const url = photo.webPath || photo.path;
    if (!url) {
      throw new Error('No se pudo obtener la fuente de la foto.');
    }

    const response = await fetch(url);
    return response.blob();
  }

  async uploadCapturedPhoto(
    photo: Photo,
    title: string,
    description: string,
    folderId: number | null,
  ): Promise<{ message: string }> {
    const photoUrl = photo.webPath || photo.path || `photos/${Date.now()}.jpg`;
    const item: UserPhoto = {
      id: `local_${Date.now()}`,
      localId: `local_${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      folder_id: folderId ?? 3,
      folder_name: this.resolveFolderName(folderId),
      user_id: 0,
      created_at: new Date().toISOString(),
      image_path: photoUrl,
      file_path: photoUrl,
      file_name: photoUrl.split('/').pop() || `photo_${Date.now()}.jpg`,
      url: photoUrl,
      webviewPath: photoUrl,
      isFavorite: false,
      favorite: false,
      syncStatus: 'local',
    };

    const existing = this.photosState();
    const updated = [item, ...existing.map(photo => this.normalizePhoto(photo))];
    this.photosState.set(updated);
    await this.savePhotos(updated);

    return { message: 'Fotografía guardada con éxito.' };
  }

  async updateFavorite(photo: UserPhoto): Promise<UserPhoto> {
    const current = this.photosState();
    const normalized = current.map(item => {
      if (String(item.id ?? item.localId) === String(photo.id ?? photo.localId)) {
        return {
          ...item,
          ...photo,
          isFavorite: !!photo.isFavorite,
          favorite: photo.favorite ?? photo.isFavorite,
        };
      }
      return item;
    });

    this.photosState.set(normalized);
    await this.savePhotos(normalized);
    return photo;
  }

  async updatePhoto(photo: UserPhoto): Promise<UserPhoto> {
    const current = this.photosState();
    const updated = current.map(item => {
      if (String(item.id ?? item.localId) === String(photo.id ?? photo.localId)) {
        return { ...item, ...photo };
      }
      return item;
    });

    this.photosState.set(updated);
    await this.savePhotos(updated);
    return photo;
  }

  async deletePhoto(photo: UserPhoto): Promise<{ message: string }> {
    const current = this.photosState();
    const filtered = current.filter(item => String(item.id ?? item.localId) !== String(photo.id ?? photo.localId));
    this.photosState.set(filtered);
    await this.savePhotos(filtered);
    return { message: 'Foto eliminada con éxito.' };
  }

  private async readPhotosFromStorage(): Promise<UserPhoto[]> {
    const stored = await Preferences.get({ key: 'ecos_photos' });
    if (!stored.value) {
      return [];
    }

    try {
      const parsed = JSON.parse(stored.value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private async savePhotos(photos: UserPhoto[]): Promise<void> {
    await Preferences.set({
      key: 'ecos_photos',
      value: JSON.stringify(photos.map(photo => this.normalizePhoto(photo))),
    });
  }

  private normalizePhoto(photo: UserPhoto): UserPhoto {
    const filePath = photo.file_path || photo.image_path || photo.url || photo.webviewPath || '';
    return {
      ...photo,
      file_name: photo.file_name || filePath.split('/').pop() || 'photo.jpg',
      webviewPath: photo.webviewPath || photo.url || photo.file_path || photo.image_path || '',
      file_path: filePath,
      image_path: photo.image_path || filePath,
      url: photo.url || filePath,
      isFavorite: !!photo.isFavorite,
      favorite: photo.favorite ?? photo.isFavorite,
    };
  }

  private resolveFolderName(folderId: number | null): string {
    const mapping: Record<number, string> = {
      1: 'Todas las Imagenes',
      2: 'Favoritas',
      3: 'Sin Carpeta',
    };
    return mapping[folderId ?? 3] ?? 'Sin Carpeta';
  }

  private dataUrlToBlob(dataUrl: string): Blob {
    const [header, base64] = dataUrl.split(',');
    const mimeMatch = header.match(/data:(.*?);base64/);
    const mime = mimeMatch?.[1] ?? 'image/jpeg';
    const binary = atob(base64 || '');
    const bytes = new Uint8Array(binary.length);

    for (let index = 0; index < binary.length; index++) {
      bytes[index] = binary.charCodeAt(index);
    }

    return new Blob([bytes], { type: mime });
  }
}
