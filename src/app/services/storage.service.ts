import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

export interface PendingAction {
  id: string;
  type: 'CREATE_NOTE' | 'UPDATE_NOTE' | 'DELETE_NOTE' | 'UPLOAD_PHOTO' | 'UPDATE_PHOTO' | 'DELETE_PHOTO';
  payload: any;
  timestamp: number;
}

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private readonly PREFIX = 'ecos_';
  private readonly NOTES_KEY = `${this.PREFIX}notes_`;
  private readonly CATEGORIES_KEY = `${this.PREFIX}categories`;
  private readonly PHOTOS_KEY = `${this.PREFIX}photos_`;
  private readonly FOLDERS_KEY = `${this.PREFIX}folders`;
  private readonly SYNC_QUEUE_KEY = `${this.PREFIX}sync_queue`;

  // ==========================================
  // OPERACIONES BASE DE PREFERENCES (KV STORAGE)
  // ==========================================

  async get<T>(key: string, defaultValue?: T): Promise<T | null> {
    try {
      const { value } = await Preferences.get({ key });
      if (value !== null && value !== undefined) {
        return JSON.parse(value) as T;
      }
      return defaultValue ?? null;
    } catch (error) {
      console.warn(`[StorageService] Error al leer la clave "${key}":`, error);
      return defaultValue ?? null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      await Preferences.set({
        key,
        value: JSON.stringify(value),
      });
    } catch (error) {
      console.error(`[StorageService] Error al guardar la clave "${key}":`, error);
    }
  }

  async remove(key: string): Promise<void> {
    try {
      await Preferences.remove({ key });
    } catch (error) {
      console.error(`[StorageService] Error al eliminar la clave "${key}":`, error);
    }
  }

  // ==========================================
  // PERSISTENCIA DE NOTAS
  // ==========================================

  async getNotes<T = any>(userId: number | string): Promise<T[]> {
    const key = `${this.NOTES_KEY}${userId}`;
    const notes = await this.get<T[]>(key, []);
    return notes || [];
  }

  async saveNotes<T = any>(userId: number | string, notes: T[]): Promise<void> {
    const key = `${this.NOTES_KEY}${userId}`;
    await this.set(key, notes);
  }

  async upsertNote(userId: number | string, note: any): Promise<any[]> {
    const notes = await this.getNotes(userId);
    const index = notes.findIndex((n: any) => n.id === note.id);
    if (index >= 0) {
      notes[index] = { ...notes[index], ...note };
    } else {
      notes.unshift(note);
    }
    await this.saveNotes(userId, notes);
    return notes;
  }

  async removeNote(userId: number | string, noteId: number | string): Promise<any[]> {
    let notes = await this.getNotes(userId);
    notes = notes.filter((n: any) => n.id !== noteId);
    await this.saveNotes(userId, notes);
    return notes;
  }

  // ==========================================
  // PERSISTENCIA DE CATEGORÍAS
  // ==========================================

  async getCategories<T = any>(): Promise<T[]> {
    const categories = await this.get<T[]>(this.CATEGORIES_KEY, []);
    return categories || [];
  }

  async saveCategories<T = any>(categories: T[]): Promise<void> {
    await this.set(this.CATEGORIES_KEY, categories);
  }

  // ==========================================
  // PERSISTENCIA DE FOTOGRAFÍAS Y ÁLBUMES
  // ==========================================

  async getPhotos<T = any>(userId: number | string): Promise<T[]> {
    const key = `${this.PHOTOS_KEY}${userId}`;
    const photos = await this.get<T[]>(key, []);
    return photos || [];
  }

  async savePhotos<T = any>(userId: number | string, photos: T[]): Promise<void> {
    const key = `${this.PHOTOS_KEY}${userId}`;
    await this.set(key, photos);
  }

  async upsertPhoto(userId: number | string, photo: any): Promise<any[]> {
    const photos = await this.getPhotos(userId);
    const index = photos.findIndex((p: any) => p.id === photo.id || (photo.localId && p.localId === photo.localId));
    if (index >= 0) {
      photos[index] = { ...photos[index], ...photo };
    } else {
      photos.unshift(photo);
    }
    await this.savePhotos(userId, photos);
    return photos;
  }

  async removePhoto(userId: number | string, photoId: number | string): Promise<any[]> {
    let photos = await this.getPhotos(userId);
    photos = photos.filter((p: any) => p.id !== photoId && p.localId !== photoId);
    await this.savePhotos(userId, photos);
    return photos;
  }

  // ==========================================
  // PERSISTENCIA DE CARPETAS
  // ==========================================

  async getFolders<T = any>(): Promise<T[]> {
    const folders = await this.get<T[]>(this.FOLDERS_KEY, []);
    return folders || [];
  }

  async saveFolders<T = any>(folders: T[]): Promise<void> {
    await this.set(this.FOLDERS_KEY, folders);
  }

  // ==========================================
  // COLA DE SINCRONIZACIÓN OFFLINE
  // ==========================================

  async getPendingActions(): Promise<PendingAction[]> {
    const queue = await this.get<PendingAction[]>(this.SYNC_QUEUE_KEY, []);
    return queue || [];
  }

  async addPendingAction(action: Omit<PendingAction, 'id' | 'timestamp'>): Promise<PendingAction> {
    const queue = await this.getPendingActions();
    const newAction: PendingAction = {
      ...action,
      id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      timestamp: Date.now(),
    };
    queue.push(newAction);
    await this.set(this.SYNC_QUEUE_KEY, queue);
    return newAction;
  }

  async removePendingAction(id: string): Promise<void> {
    const queue = await this.getPendingActions();
    const updated = queue.filter(item => item.id !== id);
    await this.set(this.SYNC_QUEUE_KEY, updated);
  }

  async clearPendingActions(): Promise<void> {
    await this.remove(this.SYNC_QUEUE_KEY);
  }

  // ==========================================
  // ARCHIVOS BINARIOS DE FOTOS (FILESYSTEM)
  // ==========================================

  /**
   * Guarda una imagen en el almacenamiento local persistente del dispositivo.
   * Retorna una ruta webview utilizable en <img [src]>.
   */
  async saveImageLocally(fileName: string, base64Data: string): Promise<{ uri: string; webviewPath: string }> {
    try {
      const cleanData = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
      const path = `photos/${fileName}`;

      const saved = await Filesystem.writeFile({
        path,
        data: cleanData,
        directory: Directory.Data,
        recursive: true,
      });

      const webviewPath = Capacitor.convertFileSrc(saved.uri);
      return { uri: saved.uri, webviewPath };
    } catch (error) {
      console.warn('[StorageService] Error guardando archivo localmente:', error);
      // Fallback para navegador web si falla Filesystem
      const fallbackUrl = base64Data.startsWith('data:') ? base64Data : `data:image/jpeg;base64,${base64Data}`;
      return { uri: fileName, webviewPath: fallbackUrl };
    }
  }

  /**
   * Elimina un archivo del almacenamiento local persistente.
   */
  async deleteLocalImage(fileName: string): Promise<void> {
    try {
      const path = fileName.startsWith('photos/') ? fileName : `photos/${fileName}`;
      await Filesystem.deleteFile({
        path,
        directory: Directory.Data,
      });
    } catch (error) {
      console.warn('[StorageService] No se pudo eliminar el archivo local:', error);
    }
  }
}

