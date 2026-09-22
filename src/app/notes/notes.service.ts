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

// Interfaz para mapear la respuesta estructurada de tus APIs
export interface ApiResponse {
  success: boolean;
  message?: string;
  data?: Note[];
}

@Injectable({
  providedIn: 'root'
})
export class NotesService {
  // Ajusta la URL a la ruta de tu servidor local
  private baseUrl = 'http://localhost/ecos-ionic'; 

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  constructor(private http: HttpClient) {}

  /**
   * GET: Obtiene las notas y extrae el arreglo "data" de la respuesta.
   * También convierte is_pinned (0 o 1) a un valor booleano para el HTML.
   */
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
      // Interceptar el error 404 y devolver un arreglo vacío
      catchError(err => {
        if (err.status === 404) {
          return of([]); 
        }
        throw err; // Si es un error 500 u otro, sí lo dejamos pasar
      })
    );
  }

  /**
   * CREATE / UPDATE: Guarda o actualiza la nota dependiendo de si tiene ID.
   * La API requiere 'content' y 'user_id'.
   */
  saveNote(note: Note): Observable<ApiResponse> {
    // Convertir el booleano is_pinned a 1 o 0 para la base de datos
    const payload = {
      ...note,
      is_pinned: note.is_pinned ? 1 : 0
    };

    if (payload.id) {
      // Actualizar nota existente
      const url = `${this.baseUrl}/update_note.php`; 
      return this.http.post<ApiResponse>(url, payload, this.httpOptions);
    } else {
      // Crear nueva nota
      const url = `${this.baseUrl}/upload_note.php`; 
      return this.http.post<ApiResponse>(url, payload, this.httpOptions);
    }
  }

  /**
   * DELETE: Elimina la nota.
   * La API espera el método DELETE y requiere id y user_id en el body.
   */
  deleteNote(noteId: number, userId: number): Observable<ApiResponse> {
    const url = `${this.baseUrl}/delete_note.php`;
    // En Angular, para enviar un body en una petición DELETE, usamos request()
    return this.http.request<ApiResponse>('delete', url, {
      body: { id: noteId, user_id: userId },
      headers: this.httpOptions.headers
    });
  }
}