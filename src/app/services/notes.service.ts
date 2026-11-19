import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, map, switchMap, catchError, of, retry } from 'rxjs';
import { Preferences } from '@capacitor/preferences';
import { StorageService } from './storage.service';
import { NetworkService } from './network.service';

export interface Category {
  id: number | string;
  name: string;
}

export interface Note {
  id?: number;
  user_id: number;
  title: string;
  content: string;
  category_id: number | string;
  category?: string;
  color: string;
  is_pinned?: boolean | number;
  created_at?: string;
  updated_at?: string;
  syncStatus?: 'synced' | 'pending_create' | 'pending_update' | 'pending_delete';
}

export interface ApiResponse {
  success: boolean;
  message?: string;
  data?: Note[];
}

@Injectable({
  providedIn: 'root',
})
export class NotesService {
  private http = inject(HttpClient);
  private storageService = inject(StorageService);
  private networkService = inject(NetworkService);

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
    }),
  };

  // Genera el observable de la URL base dinámicamente
  private getBaseUrl(): Observable<string> {
    return from(Preferences.get({ key: 'serverConfig' })).pipe(
      map((res) => {
        if (res.value) {
          const config = JSON.parse(res.value);
          const ip = config.ip || 'localhost';
          const port = '80';
          return `http://${ip}:${port}/ecos-ionic`;
        }
        return 'http://localhost/ecos-ionic';
      })
    );
  }

  // Traer Notas con persistencia local (Cache-First / Offline Support)
  getNotes(userId: number): Observable<Note[]> {
    return from(this.storageService.getNotes<Note>(userId)).pipe(
      switchMap((localNotes) => {
        // Si no hay conexión, retornar notas locales inmediatamente
        if (!this.networkService.isOnline()) {
          return of(localNotes);
        }

        // Si hay conexión, consultar el servidor y actualizar almacenamiento local
        return this.getBaseUrl().pipe(
          switchMap((baseUrl) => {
            const url = `${baseUrl}/get_notes.php?user_id=${userId}`;
            return this.http.get<ApiResponse>(url);
          }),
          retry({ count: 1, delay: 1000 }),
          switchMap(async (res) => {
            if (res.success && Array.isArray(res.data)) {
              const serverNotes = res.data.map((note) => ({
                ...note,
                is_pinned: note.is_pinned == 1,
                syncStatus: 'synced' as const,
              }));

              // Conservar notas pendientes creadas localmente que no se hayan sincronizado
              const pendingLocalNotes = localNotes.filter(
                (n) => n.syncStatus === 'pending_create'
              );

              const mergedMap = new Map<number, Note>();
              serverNotes.forEach((n) => {
                if (n.id) mergedMap.set(n.id, n);
              });
              pendingLocalNotes.forEach((n) => {
                if (n.id) mergedMap.set(n.id, n);
              });

              const mergedNotes = Array.from(mergedMap.values());
              await this.storageService.saveNotes(userId, mergedNotes);
              return mergedNotes;
            }
            return localNotes;
          }),
          catchError((err) => {
            console.warn('[NotesService] Servidor inaccesible. Mostrando notas de persistencia local:', err);
            return of(localNotes);
          })
        );
      }),
      catchError(() => from(this.storageService.getNotes<Note>(userId)))
    );
  }

  // Traer Categorías con soporte local
  getCategories(): Observable<Category[]> {
    const defaultCategories: Category[] = [
      { id: 1, name: 'General' },
      { id: 2, name: 'Trabajo' },
      { id: 3, name: 'Personal' },
      { id: 4, name: 'Ideas' },
    ];

    return from(this.storageService.getCategories<Category>()).pipe(
      switchMap((cachedCategories) => {
        const baseCategories = cachedCategories && cachedCategories.length > 0 ? cachedCategories : defaultCategories;

        if (!this.networkService.isOnline()) {
          return of(baseCategories);
        }

        return this.getBaseUrl().pipe(
          switchMap((baseUrl) => {
            const url = `${baseUrl}/get_categories.php`;
            return this.http.get<any>(url);
          }),
          retry({ count: 1, delay: 1000 }),
          switchMap(async (res) => {
            if (res.success && res.data && Array.isArray(res.data)) {
              const serverCategories = res.data.map((cat: any) => ({
                id: cat.id,
                name: cat.nombre || cat.name || cat.categoria,
              }));
              await this.storageService.saveCategories(serverCategories);
              return serverCategories;
            }
            return baseCategories;
          }),
          catchError(() => of(baseCategories))
        );
      }),
      catchError(() => of(defaultCategories))
    );
  }

  // Guardar / Actualizar nota con persistencia local inmediata
  saveNote(note: Note): Observable<ApiResponse> {
    const isNew = !note.id || note.id < 0;
    const nowIso = new Date().toISOString();

    const noteToSave: Note = {
      ...note,
      id: isNew ? (note.id || -Date.now()) : note.id,
      is_pinned: note.is_pinned ? 1 : 0,
      created_at: note.created_at || nowIso,
      updated_at: nowIso,
      syncStatus: isNew ? 'pending_create' : 'pending_update',
    };

    return from(this.storageService.upsertNote(noteToSave.user_id, noteToSave)).pipe(
      switchMap(() => {
        // Si no hay red, la nota ya está guardada localmente
        if (!this.networkService.isOnline()) {
          this.storageService.addPendingAction({
            type: isNew ? 'CREATE_NOTE' : 'UPDATE_NOTE',
            payload: noteToSave,
          });
          return of({
            success: true,
            message: 'Nota guardada localmente en tu móvil (modo sin conexión).',
            data: [noteToSave],
          });
        }

        // Si hay red, sincronizar con el servidor
        return this.getBaseUrl().pipe(
          switchMap((baseUrl) => {
            const url = isNew
              ? `${baseUrl}/upload_note.php`
              : `${baseUrl}/update_note.php`;

            const payload = {
              ...noteToSave,
              // Si es un id temporal generado localmente, no enviarlo como id en el insert
              id: isNew ? undefined : noteToSave.id,
            };

            return this.http.post<ApiResponse>(url, payload, this.httpOptions);
          }),
          retry({ count: 1, delay: 1000 }),
          switchMap(async (res) => {
            if (res.success) {
              const serverNote = res.data && res.data[0] ? res.data[0] : null;
              const syncedNote: Note = {
                ...noteToSave,
                id: serverNote?.id || noteToSave.id,
                syncStatus: 'synced',
              };

              // Si se reemplaza un ID temporal negativo, limpiar el anterior
              if (isNew && noteToSave.id && serverNote?.id && noteToSave.id !== serverNote.id) {
                await this.storageService.removeNote(noteToSave.user_id, noteToSave.id);
              }

              await this.storageService.upsertNote(noteToSave.user_id, syncedNote);
              return {
                success: true,
                message: res.message || 'Nota guardada y sincronizada.',
                data: [syncedNote],
              };
            }

            // Si el servidor devolvió error pero se guardó en local
            await this.storageService.addPendingAction({
              type: isNew ? 'CREATE_NOTE' : 'UPDATE_NOTE',
              payload: noteToSave,
            });
            return {
              success: true,
              message: 'Guardada localmente (pendiente de sincronización).',
              data: [noteToSave],
            };
          }),
          catchError((err) => {
            console.warn('[NotesService] Error al comunicar con la API, se mantiene copia local:', err);
            this.storageService.addPendingAction({
              type: isNew ? 'CREATE_NOTE' : 'UPDATE_NOTE',
              payload: noteToSave,
            });
            return of({
              success: true,
              message: 'Nota guardada localmente en tu móvil.',
              data: [noteToSave],
            });
          })
        );
      })
    );
  }

  // Borrar Nota con eliminación local inmediata
  deleteNote(noteId: number, userId: number): Observable<ApiResponse> {
    return from(this.storageService.removeNote(userId, noteId)).pipe(
      switchMap(() => {
        if (!this.networkService.isOnline() || noteId < 0) {
          if (noteId > 0) {
            this.storageService.addPendingAction({
              type: 'DELETE_NOTE',
              payload: { id: noteId, user_id: userId },
            });
          }
          return of({
            success: true,
            message: 'Nota eliminada localmente del móvil.',
          });
        }

        return this.getBaseUrl().pipe(
          switchMap((baseUrl) => {
            const url = `${baseUrl}/delete_note.php`;
            return this.http.request<ApiResponse>('delete', url, {
              body: { id: noteId, user_id: userId },
              headers: this.httpOptions.headers,
            });
          }),
          retry({ count: 1, delay: 1000 }),
          map((res) => {
            return {
              success: true,
              message: res.message || 'Nota eliminada correctamente.',
            };
          }),
          catchError((err) => {
            console.warn('[NotesService] Error eliminando en servidor, se eliminó localmente:', err);
            this.storageService.addPendingAction({
              type: 'DELETE_NOTE',
              payload: { id: noteId, user_id: userId },
            });
            return of({
              success: true,
              message: 'Nota eliminada localmente (se sincronizará al haber conexión).',
            });
          })
        );
      })
    );
  }
}
