import { Routes } from '@angular/router';
import { authGuard, publicGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then((m) => m.LoginPage),
    canActivate: [publicGuard],
  },
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
    canActivate: [authGuard],
  },
  {
    path: 'dashboard',
    redirectTo: 'tabs/dashboard',
    pathMatch: 'full',
  },
  {
    path: 'album',
    redirectTo: 'tabs/album',
    pathMatch: 'full',
  },
  {
    path: 'camera',
    redirectTo: 'tabs/camera',
    pathMatch: 'full',
  },
  {
    path: 'perfil',
    redirectTo: 'tabs/perfil',
    pathMatch: 'full',
  },
  {
    path: 'notes',
    redirectTo: 'tabs/notes',
    pathMatch: 'full',
  },
];
