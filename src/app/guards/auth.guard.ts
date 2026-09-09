import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard que protege las rutas privadas de la aplicación.
 * Si el usuario no ha iniciado sesión, es redirigido a la pantalla de login.
 */
export const authGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isAuth = await authService.isAuthenticated();
  if (isAuth) {
    return true;
  }

  return router.createUrlTree(['/login']);
};

/**
 * Guard para la ruta de login.
 * Si el usuario ya cuenta con una sesión activa, se redirige a la vista principal.
 */
export const publicGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isAuth = await authService.isAuthenticated();
  if (isAuth) {
    return router.createUrlTree(['/tabs/dashboard']);
  }

  return true;
};

