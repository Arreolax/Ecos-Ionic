import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';
import { authGuard } from '../guards/auth.guard';

export const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('../dashboard/dashboard.page').then((m) => m.DashboardPage),
      },
      {
        path: 'album',
        loadComponent: () => import('../album/album.page').then((m) => m.AlbumPage),
      },
      {
        path: 'camera',
        loadComponent: () => import('../camera/camera.page').then((m) => m.CameraPage),
      },
      {
        path: 'tab2',
        redirectTo: 'album',
        pathMatch: 'full',
      },
      {
        path: 'tab3',
        redirectTo: 'perfil',
        pathMatch: 'full',
      },
      {
        path: 'perfil',
        loadComponent: () => import('../perfil/perfil.page').then((m) => m.PerfilPage),
      },
      {
        path: 'login',
        redirectTo: '/login',
        pathMatch: 'full',
      },
      {
        path: '',
        redirectTo: '/tabs/dashboard',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: '/tabs/dashboard',
    pathMatch: 'full',
  },
];
