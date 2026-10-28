import { CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  Subject,
  catchError,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  map,
  of,
  startWith,
  switchMap,
} from 'rxjs';
import { BrandApi, ProductApi } from '../../core/api/api.services';
import { Page, Product } from '../../core/api/models';
import { errorMessage } from '../../core/api/problem';
import { AuthService } from '../../core/auth/auth.service';

const EMPTY_PAGE: Page<Product> = {
  content: [],
  page: 0,
  size: 20,
  totalElements: 0,
  totalPages: 0,
};

@Component({
  selector: 'app-catalog',
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe],
  template: `
    <div class="page-head">
      <h1>Catálogo</h1>
      @if (!auth.isStaff()) {
        <p class="muted">Solo ves las marcas que tu empresa tiene licenciadas hoy.</p>
      }
    </div>

    <div class="search">
      <div>
        <label for="q">Buscar por nombre o SKU</label>
        <input id="q" type="search" [formControl]="text" placeholder="Por ejemplo: iPhone 17" />
      </div>
      <div>
        <label for="brand">Marca</label>
        <select id="brand" [formControl]="brand">
          <option [ngValue]="null">Todas</option>
          @for (option of brands(); track option.id) {
            <option [ngValue]="option.id">{{ option.name }}</option>
          }
        </select>
      </div>
    </div>

    @if (error(); as message) {
      <p class="alert" role="alert">{{ message }}</p>
    }

    @if (result(); as page) {
      @if (page.content.length === 0) {
        <div class="panel empty">No hay productos que coincidan con la búsqueda.</div>
      } @else {
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Producto</th>
                <th>Marca</th>
                <th class="num">Precio</th>
                <th class="num">Stock</th>
                <th><span class="visually-hidden">Acción</span></th>
              </tr>
            </thead>
            <tbody>
              @for (product of page.content; track product.id) {
                <tr>
                  <td>{{ product.sku }}</td>
                  <td>{{ product.name }}</td>
                  <td>{{ product.brandName }}</td>
                  <td class="num">{{ product.unitPrice | currency: 'EUR' }}</td>
                  <td class="num" [class.out]="product.stock === 0">
                    {{ product.stock === 0 ? 'Agotado' : product.stock }}
                  </td>
                  <td>
                    <a [routerLink]="['/orders/new']" [queryParams]="{ productId: product.id }"
                      >Pedir</a
                    >
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <div class="pager">
          <span class="muted">{{ page.totalElements }} productos</span>
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
  `,
  styles: `
    .search {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 1rem;
      margin-bottom: 1rem;
      max-width: 44rem;
    }
    .out {
      color: var(--danger);
      font-weight: 600;
    }
    .visually-hidden {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
    }
    @media (max-width: 600px) {
      .search {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class Catalog {
  private readonly productApi = inject(ProductApi);
  protected readonly auth = inject(AuthService);

  protected readonly text = new FormControl('', { nonNullable: true });
  protected readonly brand = new FormControl<number | null>(null);
  private readonly pageChanges = new Subject<number>();
  protected readonly error = signal<string | null>(null);

  protected readonly brands = toSignal(inject(BrandApi).findAll(), { initialValue: [] });

  /**
   * The classic RxJS search box:
   * - debounceTime: wait until the user stops typing for 300 ms instead of one request per key;
   * - distinctUntilChanged: no request if the text did not really change;
   * - switchMap: if a new search starts, the previous request is cancelled.
   * Each new filter starts again at page 0; the pager then emits the pages the user asks for.
   */
  protected readonly result = toSignal(
    combineLatest([
      this.text.valueChanges.pipe(
        startWith(''),
        debounceTime(300),
        map((t) => t.trim()),
        distinctUntilChanged(),
      ),
      this.brand.valueChanges.pipe(startWith(null)),
    ]).pipe(
      switchMap(([q, brandId]) =>
        this.pageChanges.pipe(
          startWith(0),
          switchMap((page) =>
            this.productApi.search({ q, brandId, page }).pipe(
              catchError((error: unknown) => {
                this.error.set(errorMessage(error));
                return of(EMPTY_PAGE);
              }),
            ),
          ),
        ),
      ),
    ),
  );

  protected goTo(page: number): void {
    this.pageChanges.next(page);
  }
}
