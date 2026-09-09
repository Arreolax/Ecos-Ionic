import { Injectable, signal } from '@angular/core';
import axios from 'axios';
import { Preferences } from '@capacitor/preferences';

export interface User {
  id: number | string;
  name: string;
  username?: string;
  email: string;
  telefono?: string;
  terms_service?: number | boolean;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private loginUrl = 'http://localhost/p1-u1/login.php';
  private registerUrl = 'http://localhost/p1-u1/register.php';
  private updateProfileUrl = 'http://localhost/p1-u1/update_user.php';
  private deleteAccountUrl = 'http://localhost/p1-u1/delete_user.php';

  public currentUser = signal<User | null>(null);
  private initialLoadPromise: Promise<void>;

  constructor() {
    this.initialLoadPromise = this.loadStoredUser();
  }

  async loadStoredUser(): Promise<void> {
    const { value } = await Preferences.get({ key: 'user' });
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
      const response = await axios.post<AuthResponse>(
        this.loginUrl,
        { email, password },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data && response.data.success && response.data.user) {
        this.currentUser.set(response.data.user);
        await Preferences.set({
          key: 'user',
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
        message: error.message || 'Error de conexión con el servidor.',
      };
    }
  }

  async register(
    name: string,
    username: string,
    email: string,
    telefono: string,
    password: string,
    terms_service: boolean | number
  ): Promise<AuthResponse> {
    try {
      const response = await axios.post<AuthResponse>(
        this.registerUrl,
        {
          name,
          username,
          email,
          telefono,
          password,
          terms_service: terms_service ? 1 : 0,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error: any) {
      if (error.response && error.response.data) {
        return error.response.data as AuthResponse;
      }
      return {
        success: false,
        message: error.message || 'Error de conexión con el servidor.',
      };
    }
  }

  async updateProfile(id: number | string, name: string, username: string, email: string, telefono: string, password?: string): Promise<AuthResponse> {
    try {
      const payload: any = { id, name, username, email, telefono };
      if (password && password.trim()) {
        payload.password = password.trim();
      }

      const response = await axios.post<AuthResponse>(
        this.updateProfileUrl,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data && response.data.success && response.data.user) {
        this.currentUser.set(response.data.user);
        await Preferences.set({
          key: 'user',
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
        message: error.message || 'Error de conexión al actualizar el perfil.',
      };
    }
  }

  async deleteAccount(id: number | string): Promise<AuthResponse> {
    try {
      const response = await axios.post<AuthResponse>(
        this.deleteAccountUrl,
        { id },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
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
        message: error.message || 'Error de conexión al eliminar la cuenta.',
      };
    }
  }

  async logout() {
    this.currentUser.set(null);
    await Preferences.remove({ key: 'user' });
  }
}

