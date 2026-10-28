import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { OrderApi, OrderTransition } from '../../core/api/api.services';
import { Order, OrderAction } from '../../core/api/models';
import { errorMessage } from '../../core/api/problem';
import { AuthService } from '../../core/auth/auth.service';
import { LifeCycleTrack } from '../../shared/life-cycle-track';
import { StatusBadge } from '../../shared/status-badge';

interface ActionButton {
  action: OrderTransition;
  label: string;
  style: 'primary' | 'secondary' | 'danger';
  confirmText?: string;
}

/** Buttons for each action the API says is available. The API decides; the screen only shows. */
const BUTTONS: Partial<Record<OrderAction, ActionButton>> = {
  CONFIRM: { action: 'confirm', label: 'Confirmar pedido', style: 'primary' },
  SHIP: { action: 'ship', label: 'Marcar como enviado', style: 'primary' },
  DELIVER: { action: 'deliver', label: 'Marcar como entregado', style: 'primary' },
  CANCEL: {
    action: 'cancel',
    label: 'Cancelar pedido',
    style: 'danger',
    confirmText: '¿Cancelar este pedido? Si estaba confirmado, el stock vuelve al almacén.',
  },
};

@Component({
  selector: 'app-order-detail',
  imports: [RouterLink, CurrencyPipe, DatePipe, StatusBadge, LifeCycleTrack],
  template: `
    <p><a routerLink="/orders">Volver a pedidos</a></p>

    @if (error(); as message) {
      <p class="alert" role="alert">{{ message }}</p>
    }

    @if (order(); as order) {
      <div class="page-head">
        <h1>Pedido {{ order.id }}</h1>
        <app-status-badge [status]="order.status" />
      </div>

      <section class="panel stub">
        <app-life-cycle-track [status]="order.status" />
        <dl>
          <div>
            <dt>Cliente</dt>
            <dd>
              @if (auth.isStaff()) {
                <a [routerLink]="['/customers', order.customerId]">{{ order.customerName }}</a>
              } @else {
                {{ order.customerName }}
              }
            </dd>
          </div>
          <div>
            <dt>Creado por</dt>
            <dd>{{ order.createdByName }}</dd>
          </div>
          <div>
            <dt>Creado</dt>
            <dd>{{ order.createdAt | date: 'd MMM y, HH:mm' }}</dd>
          </div>
          <div>
            <dt>Confirmado</dt>
            <dd>
              {{ order.confirmedAt ? (order.confirmedAt | date: 'd MMM y, HH:mm') : 'Pendiente' }}
            </dd>
          </div>
        </dl>
      </section>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Producto</th>
              <th>Marca</th>
              <th class="num">Cantidad</th>
              <th class="num">Precio</th>
              <th class="num">Importe</th>
            </tr>
          </thead>
          <tbody>
            @for (line of order.lines; track line.productId) {
              <tr>
                <td>{{ line.sku }}</td>
                <td>{{ line.productName }}</td>
                <td>{{ line.brandName }}</td>
                <td class="num">{{ line.quantity }}</td>
                <td class="num">{{ line.unitPrice | currency: 'EUR' }}</td>
                <td class="num">{{ line.lineTotal | currency: 'EUR' }}</td>
              </tr>
            }
          </tbody>
          <tfoot>
            <tr>
              <td colspan="5">Total</td>
              <td class="num">{{ order.total | currency: 'EUR' }}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      @if (canEdit() || buttons().length > 0) {
        <div class="actions">
          @if (canEdit()) {
            <a class="button secondary" [routerLink]="['/orders', order.id, 'edit']"
              >Editar líneas</a
            >
          }
          @for (button of buttons(); track button.action) {
            <button type="button" [class]="button.style" [disabled]="busy()" (click)="run(button)">
              {{ button.label }}
            </button>
          }
        </div>
      } @else if (order.status === 'CONFIRMED' && !auth.isStaff()) {
        <p class="muted">Pedido confirmado. Para cambiarlo o cancelarlo, habla con tu comercial.</p>
      }
    } @else if (!error()) {
      <p class="muted">Cargando pedido…</p>
    }
  `,
  styles: `
    .stub {
      margin-bottom: 1.25rem;
    }
    dl {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
      gap: 1rem;
      margin: 1.5rem 0 0;
      padding-top: 1rem;
      border-top: 1px dashed var(--line);
    }
    dt {
      font-size: 0.8125rem;
      color: var(--muted);
    }
    dd {
      margin: 0;
      font-weight: 600;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-top: 1.25rem;
    }
    .actions .danger {
      margin-left: auto;
    }
  `,
})
export class OrderDetail {
  private readonly api = inject(OrderApi);
  protected readonly auth = inject(AuthService);

  /** Filled from the route (/orders/:id) thanks to withComponentInputBinding. */
  readonly id = input.required<string>();

  protected readonly order = signal<Order | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly busy = signal(false);

  protected readonly canEdit = computed(
    () => this.order()?.availableActions.includes('EDIT_LINES') ?? false,
  );
  protected readonly buttons = computed(() =>
    (this.order()?.availableActions ?? [])
      .map((action) => BUTTONS[action])
      .filter((button): button is ActionButton => button !== undefined),
  );

  constructor() {
    // Reload whenever the id in the URL changes.
    effect(() => {
      const id = Number(this.id());
      this.order.set(null);
      this.error.set(null);
      this.api.findById(id).subscribe({
        next: (order) => this.order.set(order),
        error: (error: unknown) => this.error.set(errorMessage(error)),
      });
    });
  }

  protected run(button: ActionButton): void {
    const order = this.order();
    if (!order || (button.confirmText && !window.confirm(button.confirmText))) {
      return;
    }
    this.busy.set(true);
    this.error.set(null);
    this.api.transition(order.id, button.action).subscribe({
      next: (updated) => {
        this.order.set(updated);
        this.busy.set(false);
      },
      error: (error: unknown) => {
        this.error.set(errorMessage(error));
        this.busy.set(false);
      },
    });
  }
}
