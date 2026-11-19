import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { timeout, catchError } from 'rxjs/operators';
import { throwError, TimeoutError } from 'rxjs';
import { NetworkService } from '../services/network.service';
import { LoadingService } from '../services/loading.service';
import { ToastService } from '../services/toast.service';

/** Tiempo máximo de espera por petición HTTP (ms) */
const REQUEST_TIMEOUT_MS = 10_000;

export const httpErrorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const toastService = inject(ToastService);
  const networkService = inject(NetworkService);
  const loadingService = inject(LoadingService);

  // Bloquear petición si no hay red
  if (!networkService.isOnline()) {
    toastService.warning('Sin conexión a internet. Verifica tu red.');
    return throwError(() => new Error('No hay conexión a internet.'));
  }

  return next(req).pipe(
    // Cancela la petición si tarda más de REQUEST_TIMEOUT_MS
    timeout(REQUEST_TIMEOUT_MS),
    catchError((error: unknown) => {
      let message = 'Error de conexión con el servidor.';

      if (error instanceof TimeoutError) {
        message = 'La petición tardó demasiado. Verifica tu conexión.';
      } else if (error instanceof HttpErrorResponse) {
        switch (error.status) {
          case 0:
            message = 'No se pudo conectar con el servidor.';
            break;
          case 401:
            message = 'Sesión expirada. Por favor, inicia sesión de nuevo.';
            break;
          case 403:
            message = 'No tienes permiso para realizar esta acción.';
            break;
          case 404:
            // 404 no es crítico — dejar que cada servicio lo maneje
            return throwError(() => error);
          case 500:
            message = 'Error interno del servidor. Intenta más tarde.';
            break;
          default:
            message = error.message || message;
        }
      }

      loadingService.dismiss();
      toastService.error(message);
      return throwError(() => error);
    })
  );
};

