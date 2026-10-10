import { Injectable, signal } from "@angular/core";
import axios from "axios";
import { Preferences } from "@capacitor/preferences";

/** Tiempo máximo de espera por petición HTTP (ms) */
const AXIOS_TIMEOUT_MS = 10_000;

export interface User {
  id: number | string;
  name: string;
  username?: string;
  email: string;
  telefono?: string;
  terms_service?: number | boolean;
  profile_photo_name?: string; // <-- NUEVO
  profile_photo_path?: string; // <-- NUEVO
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
}

@Injectable({
  providedIn: "root",
})
export class AuthService {
  public currentUser = signal<User | null>(null);
  private initialLoadPromise: Promise<void>;

  constructor() {
    this.initialLoadPromise = this.loadStoredUser();
  }

  // Genera la URL dinámica en base a la IP configurada
  private async getBaseUrl(): Promise<string> {
    const { value } = await Preferences.get({ key: "serverConfig" });
    if (value) {
      const config = JSON.parse(value);
      const ip = config.ip || "localhost";
      const port = config.port || "80";
      // Construye la URL uniendo IP y puerto
      return `http://${ip}:${port}/ecos-ionic`;
    }
    // Fallback de seguridad
    return "http://localhost/ecos-ionic";
  }

  async loadStoredUser(): Promise<void> {
    const { value } = await Preferences.get({ key: "user" });
    if (value) {
      try {
        this.currentUser.set(JSON.parse(value));
      } catch (e) {
        this.currentUser.set(null);
      }
    }
  }

  async isAuthenticated(): Promise<boolean> {
    if (this.currentUser()) {
      return true;
    }
    await this.initialLoadPromise;
    return this.currentUser() !== null;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const baseUrl = await this.getBaseUrl();
      const response = await axios.post<AuthResponse>(
        `${baseUrl}/login.php`,
        { email, password },
        {
          headers: { "Content-Type": "application/json" },
          timeout: AXIOS_TIMEOUT_MS,
        },
      );

      if (response.data && response.data.success && response.data.user) {
        this.currentUser.set(response.data.user);
        await Preferences.set({
          key: "user",
          value: JSON.stringify(response.data.user),
        });
      }

      return response.data;
    } catch (error: any) {
      if (error.response && error.response.data) {
        return error.response.data as AuthResponse;
      }
      return {
        success: false,
        message: error.message || "Error de conexión con el servidor.",
      };
    }
  }

  async register(
    name: string,
    username: string,
    email: string,
    telefono: string,
    password: string,
    terms_service: boolean | number,
  ): Promise<AuthResponse> {
    try {
      const baseUrl = await this.getBaseUrl();
      const response = await axios.post<AuthResponse>(
        `${baseUrl}/register.php`,
        {
          name,
          username,
          email,
          telefono,
          password,
          terms_service: terms_service ? 1 : 0,
        },
        {
          headers: { "Content-Type": "application/json" },
          timeout: AXIOS_TIMEOUT_MS,
        },
      );
      return response.data;
    } catch (error: any) {
      if (error.response && error.response.data) {
        return error.response.data as AuthResponse;
      }
      return {
        success: false,
        message: error.message || "Error de conexión con el servidor.",
      };
    }
  }

  async updateProfile(
    id: number | string,
    name: string,
    username: string,
    email: string,
    telefono: string,
    password?: string,
    photoBlob?: Blob | null, // <-- NUEVO PARÁMETRO
  ): Promise<AuthResponse> {
    try {
      const baseUrl = await this.getBaseUrl();

      // Creamos un FormData en lugar de un objeto JSON
      const formData = new FormData();
      formData.append("id", String(id));
      formData.append("name", name);
      formData.append("username", username);
      formData.append("email", email);
      formData.append("telefono", telefono);

      if (password && password.trim()) {
        formData.append("password", password.trim());
      }

      // Adjuntamos la imagen si el usuario seleccionó una nueva
      if (photoBlob) {
        formData.append(
          "profile_photo",
          photoBlob,
          `avatar_${id}_${Date.now()}.jpg`,
        );
      }

      const response = await axios.post<AuthResponse>(
        `${baseUrl}/update_user.php`,
        formData, // Enviamos el FormData
        {
          headers: { "Content-Type": "multipart/form-data" }, // Cambiamos el header
          timeout: AXIOS_TIMEOUT_MS,
        },
      );

      if (response.data && response.data.success && response.data.user) {
        this.currentUser.set(response.data.user);
        await Preferences.set({
          key: "user",
          value: JSON.stringify(response.data.user),
        });
      }

      return response.data;
    } catch (error: any) {
      if (error.response && error.response.data) {
        return error.response.data as AuthResponse;
      }
      return {
        success: false,
        message: error.message || "Error de conexión al actualizar el perfil.",
      };
    }
  }

  async deleteAccount(id: number | string): Promise<AuthResponse> {
    try {
      const baseUrl = await this.getBaseUrl();
      const response = await axios.post<AuthResponse>(
        `${baseUrl}/delete_user.php`,
        { id },
        {
          headers: { "Content-Type": "application/json" },
          timeout: AXIOS_TIMEOUT_MS,
        },
      );

      if (response.data && response.data.success) {
        await this.logout();
      }

      return response.data;
    } catch (error: any) {
      if (error.response && error.response.data) {
        return error.response.data as AuthResponse;
      }
      return {
        success: false,
        message: error.message || "Error de conexión al eliminar la cuenta.",
      };
    }
  }

  async logout() {
    this.currentUser.set(null);
    await Preferences.remove({ key: "user" });
  }
}
