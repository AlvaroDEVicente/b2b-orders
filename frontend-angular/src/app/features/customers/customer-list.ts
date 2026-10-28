import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CustomerApi } from '../../core/api/api.services';
import { Customer } from '../../core/api/models';
import { errorMessage } from '../../core/api/problem';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-customer-list',
  imports: [RouterLink],
  template: `
    <div class="page-head">
      <h1>Clientes</h1>
      @if (!auth.hasRole('ADMIN')) {
        <p class="muted">Los distribuidores que llevas tú.</p>
      }
    </div>

    @if (error(); as message) {
      <p class="alert" role="alert">{{ message }}</p>
    }

    @if (customers(); as customers) {
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Empresa</th>
              <th>CIF</th>
              <th>Ciudad</th>
              @if (auth.hasRole('ADMIN')) {
                <th>Comercial</th>
              }
            </tr>
          </thead>
          <tbody>
            @for (customer of customers; track customer.id) {
              <tr class="clickable" (click)="open(customer.id)">
                <td>
                  <a
                    [routerLink]="['/customers', customer.id]"
                    (click)="$event.stopPropagation()"
                    >{{ customer.name }}</a
                  >
                  @if (!customer.active) {
                    <span class="muted"> (de baja)</span>
                  }
                </td>
                <td>{{ customer.taxId }}</td>
                <td>{{ customer.city }}</td>
                @if (auth.hasRole('ADMIN')) {
                  <td>{{ customer.salesRepName ?? 'Sin asignar' }}</td>
                }
              </tr>
            } @empty {
              <tr>
                <td colspan="4" class="empty">No tienes clientes asignados.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    } @else if (!error()) {
      <p class="muted">Cargando clientes…</p>
    }
  `,
})
export class CustomerList {
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);
  protected readonly customers = signal<Customer[] | null>(null);
  protected readonly error = signal<string | null>(null);

  constructor() {
    inject(CustomerApi)
      .findAll()
      .subscribe({
        next: (customers) => this.customers.set(customers),
        error: (error: unknown) => this.error.set(errorMessage(error)),
      });
  }

  protected open(id: number): void {
    void this.router.navigate(['/customers', id]);
  }
}
