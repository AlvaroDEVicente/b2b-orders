import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/auth/auth.guards';
import { Shell } from './layout/shell';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/login/login').then((m) => m.Login),
  },
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'orders' },
      {
        path: 'orders',
        loadComponent: () => import('./features/orders/order-list').then((m) => m.OrderList),
      },
      {
        path: 'orders/new',
        loadComponent: () => import('./features/orders/order-form').then((m) => m.OrderForm),
      },
      {
        path: 'orders/:id',
        loadComponent: () => import('./features/orders/order-detail').then((m) => m.OrderDetail),
      },
      {
        path: 'orders/:id/edit',
        loadComponent: () => import('./features/orders/order-form').then((m) => m.OrderForm),
      },
      {
        path: 'catalog',
        loadComponent: () => import('./features/catalog/catalog').then((m) => m.Catalog),
      },
      {
        path: 'customers',
        canActivate: [roleGuard('ADMIN', 'SALES')],
        loadComponent: () =>
          import('./features/customers/customer-list').then((m) => m.CustomerList),
      },
      {
        path: 'customers/:id',
        loadComponent: () =>
          import('./features/customers/customer-detail').then((m) => m.CustomerDetail),
      },
      {
        path: 'royalties',
        canActivate: [roleGuard('ADMIN')],
        loadComponent: () => import('./features/reports/royalties').then((m) => m.Royalties),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
