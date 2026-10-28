import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Role } from '../core/api/models';
import { AuthService } from '../core/auth/auth.service';
import { ROLE_LABELS } from '../shared/labels';

interface NavItem {
  path: string;
  label: string;
  roles: Role[];
}

const NAV: NavItem[] = [
  { path: '/orders', label: 'Pedidos', roles: ['ADMIN', 'SALES', 'CUSTOMER'] },
  { path: '/catalog', label: 'Catálogo', roles: ['ADMIN', 'SALES', 'CUSTOMER'] },
  { path: '/customers', label: 'Clientes', roles: ['ADMIN', 'SALES'] },
  { path: '/royalties', label: 'Royalties', roles: ['ADMIN'] },
];

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="frame">
      <header class="bar">
        <a class="brand" routerLink="/orders">B2B Orders</a>
        <nav aria-label="Principal">
          @for (item of nav(); track item.path) {
            <a [routerLink]="item.path" routerLinkActive="active">{{ item.label }}</a>
          }
          @if (ownCompanyLink(); as link) {
            <a [routerLink]="link" routerLinkActive="active">Mi empresa</a>
          }
        </nav>
        <div class="who">
          <span class="name">{{ auth.user()?.fullName }}</span>
          <span class="role">{{ roleLabel() }}</span>
          <button type="button" class="link" (click)="auth.logout()">Cerrar sesión</button>
        </div>
      </header>
      <main>
        <router-outlet />
      </main>
    </div>
  `,
  styles: `
    .frame {
      display: grid;
      grid-template-columns: 15rem 1fr;
      min-height: 100vh;
    }
    .bar {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      padding: 1.5rem 1rem;
      background: var(--ink);
      color: #fff;
    }
    .brand {
      color: #fff;
      font-weight: 700;
      font-size: 1.125rem;
      text-decoration: none;
      padding-inline: 0.75rem;
    }
    nav {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    nav a {
      color: #c9d2e3;
      text-decoration: none;
      padding: 0.5rem 0.75rem;
      border-radius: var(--radius-control);
      border-left: 3px solid transparent;
    }
    nav a:hover {
      color: #fff;
      background: rgb(255 255 255 / 0.06);
    }
    nav a.active {
      color: #fff;
      border-left-color: var(--draft-bg);
      background: rgb(255 255 255 / 0.08);
    }
    .who {
      margin-top: auto;
      display: flex;
      flex-direction: column;
      padding-inline: 0.75rem;
      font-size: 0.875rem;
    }
    .role {
      color: #c9d2e3;
    }
    .who button {
      color: #fff;
      justify-content: flex-start;
      padding-inline: 0;
      text-decoration: underline;
    }
    main {
      padding: 2rem clamp(1rem, 3vw, 2.5rem);
      max-width: 72rem;
      width: 100%;
    }
    @media (max-width: 760px) {
      .frame {
        grid-template-columns: 1fr;
      }
      .bar {
        flex-direction: row;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
      }
      nav {
        flex-direction: row;
        flex-wrap: wrap;
        order: 3;
        width: 100%;
      }
      nav a {
        border-left: none;
        border-bottom: 3px solid transparent;
        border-radius: 0;
        padding: 0.375rem 0.5rem;
      }
      nav a.active {
        border-bottom-color: var(--draft-bg);
      }
      .who {
        margin: 0 0 0 auto;
        flex-direction: row;
        align-items: center;
        gap: 0.5rem;
      }
      .who .name {
        display: none;
      }
      main {
        padding: 1.25rem 1rem;
      }
    }
  `,
})
export class Shell {
  protected readonly auth = inject(AuthService);

  protected readonly nav = computed(() => {
    const role = this.auth.role();
    return NAV.filter((item) => role !== null && item.roles.includes(role));
  });

  protected readonly roleLabel = computed(() => {
    const role = this.auth.role();
    return role ? ROLE_LABELS[role] : '';
  });

  protected readonly ownCompanyLink = computed(() => {
    const user = this.auth.user();
    return user?.role === 'CUSTOMER' && user.customerId ? `/customers/${user.customerId}` : null;
  });
}
