import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import axios from 'axios';
import { Preferences } from '@capacitor/preferences';
import { StorageService, PendingAction } from './storage.service';
import { NetworkService } from './network.service';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root',
})
export class SyncService {
  private storageService = inject(StorageService);
  private networkService = inject(NetworkService);
  private toastService = inject(ToastService);
  private http = inject(HttpClient);

  private isSyncing = false;

  constructor() {
    this.initNetworkListener();
  }

  private initNetworkListener(): void {
    // Escucha cambios en la conectividad del dispositivo
    // Cuando vuelva la conexión a internet, disparar la sincronización de acciones en cola
    setInterval(() => {
      if (this.networkService.isOnline() && !this.isSyncing) {
        this.syncPendingActions();
      }
    }, 15_000);
  }

  private async getBaseUrl(): Promise<string> {
    const { value } = await Preferences.get({ key: 'serverConfig' });
    if (value) {
      const config = JSON.parse(value);
      const ip = config.ip || 'localhost';
      const port = '80';
      return `http://${ip}:${port}/ecos-ionic`;
    }
    return 'http://localhost/ecos-ionic';
  }

  public async syncPendingActions(): Promise<void> {
    if (this.isSyncing || !this.networkService.isOnline()) {
      return;
    }

    const actions = await this.storageService.getPendingActions();
    if (actions.length === 0) {
      return;
    }

    this.isSyncing = true;
    let syncedCount = 0;

    try {
      const baseUrl = await this.getBaseUrl();

      for (const action of actions) {
        try {
          const success = await this.processAction(baseUrl, action);
          if (success) {
            await this.storageService.removePendingAction(action.id);
            syncedCount++;
          }
        } catch (itemError) {
          console.warn(`[SyncService] Falló sincronizar acción ${action.type}:`, itemError);
          // Detener el bucle si el servidor sigue sin responder
          break;
        }
      }

      if (syncedCount > 0) {
        await this.showToast(
          `Sincronización completada: ${syncedCount} cambio(s) guardado(s) en el servidor.`,
          'success'
        );
      }
    } catch (error) {
      console.warn('[SyncService] Error durante sincronización en segundo plano:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  private async processAction(baseUrl: string, action: PendingAction): Promise<boolean> {
    switch (action.type) {
      case 'CREATE_NOTE': {
        const payload = {
          title: action.payload.title,
          content: action.payload.content,
          category_id: action.payload.category_id,
          color: action.payload.color,
          user_id: action.payload.user_id,
          is_pinned: action.payload.is_pinned ? 1 : 0,
        };
        const res = await axios.post(`${baseUrl}/upload_note.php`, payload, { timeout: 10_000 });
        if (res.data && res.data.success) {
          const serverNote = res.data.data?.[0];
          if (serverNote && action.payload.id < 0) {
            await this.storageService.removeNote(action.payload.user_id, action.payload.id);
            await this.storageService.upsertNote(action.payload.user_id, {
              ...action.payload,
              id: serverNote.id,
              syncStatus: 'synced',
            });
          }
          return true;
        }
        return false;
      }

      case 'UPDATE_NOTE': {
        const payload = {
          id: action.payload.id,
          title: action.payload.title,
          content: action.payload.content,
          category_id: action.payload.category_id,
          color: action.payload.color,
          user_id: action.payload.user_id,
          is_pinned: action.payload.is_pinned ? 1 : 0,
        };
        const res = await axios.post(`${baseUrl}/update_note.php`, payload, { timeout: 10_000 });
        return res.data && res.data.success;
      }

      case 'DELETE_NOTE': {
        const res = await axios.post(`${baseUrl}/delete_note.php`, action.payload, { timeout: 10_000 });
        return res.data && res.data.success;
      }

      case 'UPLOAD_PHOTO': {
        const { base64Data, fileName, title, description, folderId, userId, localId } = action.payload;
        if (!base64Data) return true; // Si no hay datos, descartar

        const blob = this.b64toBlob(base64Data, 'image/jpeg');
        const formData = new FormData();
        formData.append('image', blob, fileName);
        formData.append('user_id', String(userId));
        formData.append('title', title);
        formData.append('description', description);
        formData.append('folder_id', String(folderId));

        const res = await axios.post(`${baseUrl}/upload_photo.php`, formData, { timeout: 30_000 });
        if (res.data && res.data.success) {
          // Actualizar estado local a sincronizado
          const localPhotos = await this.storageService.getPhotos(userId);
          const photo = localPhotos.find((p: any) => p.localId === localId);
          if (photo) {
            photo.syncStatus = 'synced';
            await this.storageService.savePhotos(userId, localPhotos);
          }
          return true;
        }
        return false;
      }

      case 'UPDATE_PHOTO': {
        const res = await axios.post(`${baseUrl}/update_photo.php`, action.payload, { timeout: 10_000 });
        return res.data && res.data.success;
      }

      case 'DELETE_PHOTO': {
        const res = await axios.post(`${baseUrl}/delete_photo.php`, action.payload, { timeout: 10_000 });
        return res.data && res.data.success;
      }

      default:
        return true;
    }
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

  private async showToast(message: string, color: 'success' | 'warning' = 'success'): Promise<void> {
    if (color === 'success') {
      await this.toastService.success(message, 'top', 3000);
    } else {
      await this.toastService.warning(message, 'top', 3000);
    }
  }
}

