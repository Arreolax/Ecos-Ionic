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
        path: 'tab2',
        loadComponent: () => import('../tab2/tab2.page').then((m) => m.Tab2Page),
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
