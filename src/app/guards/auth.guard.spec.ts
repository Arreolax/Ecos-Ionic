import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { authGuard, publicGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('AuthGuards', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
      ],
    });

    router = TestBed.inject(Router);
  });

  describe('authGuard', () => {
    it('debe permitir la navegación si el usuario está autenticado', async () => {
      authServiceSpy.isAuthenticated.and.resolveTo(true);

      const result = await TestBed.runInInjectionContext(() =>
        authGuard({} as any, {} as any)
      );

      expect(result).toBe(true);
    });

    it('debe redirigir a /login si el usuario no está autenticado', async () => {
      authServiceSpy.isAuthenticated.and.resolveTo(false);

      const result = await TestBed.runInInjectionContext(() =>
        authGuard({} as any, {} as any)
      );

      expect(result instanceof UrlTree).toBeTrue();
      expect(router.serializeUrl(result as UrlTree)).toBe('/login');
    });
  });

  describe('publicGuard', () => {
    it('debe permitir la navegación a /login si el usuario no está autenticado', async () => {
      authServiceSpy.isAuthenticated.and.resolveTo(false);

      const result = await TestBed.runInInjectionContext(() =>
        publicGuard({} as any, {} as any)
      );

      expect(result).toBe(true);
    });

    it('debe redirigir a /tabs/tab1 si el usuario ya está autenticado', async () => {
      authServiceSpy.isAuthenticated.and.resolveTo(true);

      const result = await TestBed.runInInjectionContext(() =>
        publicGuard({} as any, {} as any)
      );

      expect(result instanceof UrlTree).toBeTrue();
      expect(router.serializeUrl(result as UrlTree)).toBe('/tabs/dashboard');
    });
  });
});

