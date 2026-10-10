import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, map, switchMap, catchError, of, retry } from 'rxjs';
import { Preferences } from '@capacitor/preferences';

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
}

export interface ApiResponse {
  success: boolean;
  message?: string;
  data?: Note[];
}

@Injectable({
  providedIn: 'root'
})
export class NotesService {
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  constructor(private http: HttpClient) {}

  // Genera el observable de la URL base dinámicamente
  private getBaseUrl(): Observable<string> {
    return from(Preferences.get({ key: 'serverConfig' })).pipe(
      map(res => {
        if (res.value) {
          const config = JSON.parse(res.value);
          const ip = config.ip || 'localhost';
          const port = config.port || '80';
          return `http://${ip}:${port}/ecos-ionic`;
        }
        return 'http://localhost/ecos-ionic';
      })
    );
  }

  // Traer Notas
  getNotes(userId: number): Observable<Note[]> {
    return this.getBaseUrl().pipe(
      switchMap(baseUrl => {
        const url = `${baseUrl}/get_notes.php?user_id=${userId}`;
        return this.http.get<ApiResponse>(url);
      }),
      retry({ count: 2, delay: 1500 }),
      map(res => {
        if (res.success && res.data) {
          return res.data.map(note => ({
            ...note,
            is_pinned: note.is_pinned == 1
          }));
        }
        return [];
      }),
      catchError(err => {
        if (err.status === 404) {
          return of([]);
        }
        // Cualquier otro error: devuelve vacío (el interceptor ya mostró el toast)
        return of([]);
      })
    );
  }

  // Traer Categorías
  getCategories(): Observable<Category[]> {
    return this.getBaseUrl().pipe(
      switchMap(baseUrl => {
        const url = `${baseUrl}/get_categories.php`; 
        return this.http.get<any>(url);
      }),
      retry({ count: 2, delay: 1500 }),
      map(res => {
        if (res.success && res.data) {
          // Ajusta "cat.nombre" según cómo se llame la columna en tu base de datos
          return res.data.map((cat: any) => ({
            id: cat.id,
            name: cat.nombre || cat.name || cat.categoria 
          }));
        }
        return [];
      }),
      catchError(err => {
        console.error('Error al obtener categorías', err);
        return of([]);
      })
    );
  }

  // Guardar / Actualizar
  saveNote(note: Note): Observable<ApiResponse> {
    const payload = {
      ...note,
      is_pinned: note.is_pinned ? 1 : 0
    };

    return this.getBaseUrl().pipe(
      switchMap(baseUrl => {
        if (payload.id) {
          const url = `${baseUrl}/update_note.php`; 
          return this.http.post<ApiResponse>(url, payload, this.httpOptions);
        } else {
          const url = `${baseUrl}/upload_note.php`; 
          return this.http.post<ApiResponse>(url, payload, this.httpOptions);
        }
      }),
      retry({ count: 2, delay: 1500 }),
      catchError(err => {
        return of({ success: false, message: err.message || 'Error al guardar la nota.' });
      })
    );
  }

  // Borrar Nota
  deleteNote(noteId: number, userId: number): Observable<ApiResponse> {
    return this.getBaseUrl().pipe(
      switchMap(baseUrl => {
        const url = `${baseUrl}/delete_note.php`;
        return this.http.request<ApiResponse>('delete', url, {
          body: { id: noteId, user_id: userId },
          headers: this.httpOptions.headers
        });
      }),
      retry({ count: 2, delay: 1500 }),
      catchError(err => {
        return of({ success: false, message: err.message || 'Error al eliminar la nota.' });
      })
    );
  }
}