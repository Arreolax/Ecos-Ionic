import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';

export interface Note {
  id?: number;
  user_id: number;
  title: string;
  content: string;
  category: string;
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
  private baseUrl = 'http://localhost/ecos-ionic'; 

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  constructor(private http: HttpClient) {}

  // Traer Notas
  getNotes(userId: number): Observable<Note[]> {
    const url = `${this.baseUrl}/get_notes.php?user_id=${userId}`;
    return this.http.get<ApiResponse>(url).pipe(
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
        throw err;
      })
    );
  }

// Guardar / Actualizar
  saveNote(note: Note): Observable<ApiResponse> {
    const payload = {
      ...note,
      is_pinned: note.is_pinned ? 1 : 0
    };

    if (payload.id) {
      const url = `${this.baseUrl}/update_note.php`; 
      return this.http.post<ApiResponse>(url, payload, this.httpOptions);
    } else {
      const url = `${this.baseUrl}/upload_note.php`; 
      return this.http.post<ApiResponse>(url, payload, this.httpOptions);
    }
  }

// Borrar Nota
  deleteNote(noteId: number, userId: number): Observable<ApiResponse> {
    const url = `${this.baseUrl}/delete_note.php`;
    return this.http.request<ApiResponse>('delete', url, {
      body: { id: noteId, user_id: userId },
      headers: this.httpOptions.headers
    });
  }
}