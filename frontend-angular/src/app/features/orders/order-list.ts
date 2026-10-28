import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { catchError, combineLatest, map, of, startWith, switchMap } from 'rxjs';
import { OrderApi } from '../../core/api/api.services';
import { OrderStatus, OrderSummary, Page } from '../../core/api/models';
import { errorMessage } from '../../core/api/problem';
import { AuthService } from '../../core/auth/auth.service';
import { STATUS_LABELS } from '../../shared/labels';
import { StatusBadge } from '../../shared/status-badge';

type LoadState =
  | { kind: 'loading' }
  | { kind: 'loaded'; page: Page<OrderSummary> }
  | { kind: 'error'; message: string };

@Component({
  selector: 'app-order-list',
  imports: [RouterLink, CurrencyPipe, DatePipe, StatusBadge],
  template: `
    <div class="page-head">
      <h1>Pedidos</h1>
      <a class="button" routerLink="/orders/new">Nuevo pedido</a>
    </div>

    <div class="filters" role="group" aria-label="Filtrar por estado">
      <button
        type="button"
        class="secondary"
        [class.on]="status() === null"
        (click)="setStatus(null)"
      >
        Todos
      </button>
      @for (option of statusOptions; track option.value) {
        <button
          type="button"
          class="secondary"
          [class.on]="status() === option.value"
          (click)="setStatus(option.value)"
        >
          {{ option.label }}
        </button>
      }
    </div>

    @switch (state().kind) {
      @case ('loading') {
        <p class="muted">Cargando pedidos…</p>
      }
      @case ('error') {
        <p class="alert" role="alert">{{ errorText() }}</p>
      }
      @case ('loaded') {
        @if (page(); as page) {
          @if (page.content.length === 0) {
            <div class="panel empty">
              <p>No hay pedidos{{ status() ? ' en este estado' : '' }}.</p>
              <a class="button" routerLink="/orders/new">Crear el primero</a>
            </div>
          } @else {
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Nº</th>
                    @if (auth.isStaff()) {
                      <th>Cliente</th>
                    }
                    <th>Estado</th>
                    <th>Creado</th>
                    <th class="num">Total</th>
                  </tr>
                </thead>
                <tbody>
                  @for (order of page.content; track order.id) {
                    <tr class="clickable" (click)="open(order.id)">
                      <td>
                        <a
                          [routerLink]="['/orders', order.id]"
                          (click)="$event.stopPropagation()"
                          >{{ order.id }}</a
                        >
                      </td>
                      @if (auth.isStaff()) {
                        <td>{{ order.customerName }}</td>
                      }
                      <td><app-status-badge [status]="order.status" /></td>
                      <td>{{ order.createdAt | date: 'd MMM y, HH:mm' }}</td>
                      <td class="num">{{ order.total | currency: 'EUR' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            @if (page.totalPages > 1) {
              <div class="pager">
                <button
                  type="button"
                  class="secondary"
                  [disabled]="page.page === 0"
                  (click)="goTo(page.page - 1)"
                >
                  Anterior
                </button>
                <span>Página {{ page.page + 1 }} de {{ page.totalPages }}</span>
                <button
                  type="button"
                  class="secondary"
                  [disabled]="page.page + 1 >= page.totalPages"
                  (click)="goTo(page.page + 1)"
                >
                  Siguiente
                </button>
              </div>
            }
          }
        }
      }
    }
  `,
  styles: `
    .filters {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }
    .filters button {
      font-weight: 500;
      padding: 0.25rem 0.75rem;
      border-color: var(--line);
      color: var(--ink);
    }
    .filters button.on {
      border-color: var(--accent);
      background: var(--accent-bg);
      color: var(--accent);
      font-weight: 600;
    }
  `,
})
export class OrderList {
  private readonly api = inject(OrderApi);
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);

  protected readonly status = signal<OrderStatus | null>(null);
  protected readonly pageIndex = signal(0);

  protected readonly statusOptions = (Object.keys(STATUS_LABELS) as OrderStatus[]).map((value) => ({
    value,
    label: STATUS_LABELS[value],
  }));

  /**
   * Signals -> RxJS -> signal: every time the filter or the page changes, switchMap cancels the
   * previous request (if still running) and starts a new one, so a slow old answer never
   * overwrites a newer one.
   */
  protected readonly state = toSignal(
    combineLatest([toObservable(this.status), toObservable(this.pageIndex)]).pipe(
      switchMap(([status, page]) =>
        this.api.search({ status, page }).pipe(
          map((result): LoadState => ({ kind: 'loaded', page: result })),
          catchError((error: unknown) =>
            of<LoadState>({ kind: 'error', message: errorMessage(error) }),
          ),
          startWith<LoadState>({ kind: 'loading' }),
        ),
      ),
    ),
    { initialValue: { kind: 'loading' } as LoadState },
  );

  protected readonly page = computed(() => {
    const state = this.state();
    return state.kind === 'loaded' ? state.page : null;
  });

  protected readonly errorText = computed(() => {
    const state = this.state();
    return state.kind === 'error' ? state.message : '';
  });

  protected setStatus(status: OrderStatus | null): void {
    this.status.set(status);
    this.pageIndex.set(0);
  }

  protected goTo(page: number): void {
    this.pageIndex.set(page);
  }

  protected open(id: number): void {
    void this.router.navigate(['/orders', id]);
  }
}
