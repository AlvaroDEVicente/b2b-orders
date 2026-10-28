import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin, map, of } from 'rxjs';
import { CustomerApi, OrderApi, ProductApi } from '../../core/api/api.services';
import { Customer, OrderLineRequest, Product } from '../../core/api/models';
import { errorMessage } from '../../core/api/problem';
import { AuthService } from '../../core/auth/auth.service';

type LineGroup = FormGroup<{
  productId: FormControl<number | null>;
  quantity: FormControl<number>;
}>;

/** Form-level rule: the same product cannot appear on two lines (the API rejects it too). */
export const noDuplicateProducts: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const ids = (control as FormArray<LineGroup>).controls
    .map((line) => line.controls.productId.value)
    .filter((id): id is number => id !== null);
  return new Set(ids).size === ids.length ? null : { duplicateProduct: true };
};

/** Sum of quantity x price for the lines whose product is known. Exported for unit tests. */
export function orderTotal(
  lines: { productId: number | null; quantity: number }[],
  prices: Map<number, number>,
): number {
  const cents = lines.reduce((sum, line) => {
    const price = line.productId === null ? undefined : prices.get(line.productId);
    return price === undefined ? sum : sum + Math.round(price * 100) * (line.quantity || 0);
  }, 0);
  // Work in whole cents: 0.1 + 0.2 in floating point is 0.30000000000000004.
  return cents / 100;
}

@Component({
  selector: 'app-order-form',
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe],
  template: `
    <p><a [routerLink]="id() ? ['/orders', id()] : '/orders'">Volver</a></p>
    <div class="page-head">
      <h1>{{ id() ? 'Editar pedido ' + id() : 'Nuevo pedido' }}</h1>
    </div>

    @if (error(); as message) {
      <p class="alert" role="alert">{{ message }}</p>
    }

    <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
      @if (auth.isStaff()) {
        <div class="panel customer">
          @if (id()) {
            <p><strong>Cliente:</strong> {{ fixedCustomerName() }}</p>
          } @else {
            <label for="customer">Cliente</label>
            <select id="customer" formControlName="customerId" (change)="onCustomerChange()">
              <option [ngValue]="null" disabled>Elige un cliente</option>
              @for (customer of customers(); track customer.id) {
                <option [ngValue]="customer.id">{{ customer.name }} ({{ customer.city }})</option>
              }
            </select>
            @if (form.controls.customerId.touched && form.controls.customerId.invalid) {
              <p class="field-error">Elige el cliente del pedido.</p>
            }
          }
        </div>
      }

      @if (needsCustomer()) {
        <p class="muted">Elige un cliente para ver los productos que tiene licenciados.</p>
      } @else {
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th class="num">Precio</th>
                <th class="qty">Cantidad</th>
                <th class="num">Importe</th>
                <th><span class="visually-hidden">Quitar</span></th>
              </tr>
            </thead>
            <tbody formArrayName="lines">
              @for (line of lines.controls; track line; let i = $index) {
                <tr [formGroupName]="i">
                  <td>
                    <select
                      [attr.aria-label]="'Producto de la línea ' + (i + 1)"
                      formControlName="productId"
                    >
                      <option [ngValue]="null" disabled>Elige un producto</option>
                      @for (product of products(); track product.id) {
                        <option [ngValue]="product.id">
                          {{ product.name }} ({{ product.sku }})
                        </option>
                      }
                    </select>
                  </td>
                  <td class="num">
                    {{ priceOf(line.controls.productId.value) | currency: 'EUR' }}
                  </td>
                  <td class="qty">
                    <input
                      type="number"
                      min="1"
                      max="10000"
                      step="1"
                      [attr.aria-label]="'Cantidad de la línea ' + (i + 1)"
                      formControlName="quantity"
                    />
                  </td>
                  <td class="num">{{ lineTotal(i) | currency: 'EUR' }}</td>
                  <td>
                    <button
                      type="button"
                      class="link"
                      (click)="removeLine(i)"
                      [disabled]="lines.length === 1"
                    >
                      Quitar
                    </button>
                  </td>
                </tr>
              }
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3">Total</td>
                <td class="num">{{ total() | currency: 'EUR' }}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        @if (lines.hasError('duplicateProduct')) {
          <p class="field-error">
            Hay un producto repetido: junta las cantidades en una sola línea.
          </p>
        }
        @if (submitted() && lines.invalid && !lines.hasError('duplicateProduct')) {
          <p class="field-error">
            Revisa las líneas: cada una necesita un producto y una cantidad entre 1 y 10.000.
          </p>
        }

        <div class="actions">
          <button type="button" class="secondary" (click)="addLine()">Añadir línea</button>
          <button type="submit" [disabled]="saving()">
            {{ id() ? 'Guardar cambios' : 'Crear borrador' }}
          </button>
        </div>
        <p class="muted hint">
          El stock se descuenta al confirmar el pedido, no al guardar el borrador.
        </p>
      }
    </form>
  `,
  styles: `
    .customer {
      margin-bottom: 1.25rem;
      max-width: 32rem;
    }
    .customer p {
      margin: 0;
    }
    td select {
      min-width: 16rem;
    }
    .qty {
      width: 8rem;
    }
    .actions {
      display: flex;
      justify-content: space-between;
      gap: 0.75rem;
      margin-top: 1rem;
    }
    .hint {
      font-size: 0.875rem;
    }
    .visually-hidden {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
    }
  `,
})
export class OrderForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly orderApi = inject(OrderApi);
  private readonly productApi = inject(ProductApi);
  private readonly customerApi = inject(CustomerApi);
  protected readonly auth = inject(AuthService);

  /** Route param in /orders/:id/edit; undefined when creating. */
  readonly id = input<string>();
  /** Query param (?productId=4) when coming from the catalog. */
  readonly productId = input<string>();

  protected readonly form = this.fb.group({
    customerId: this.fb.control<number | null>(null),
    lines: this.fb.array<LineGroup>([], { validators: noDuplicateProducts }),
  });
  protected readonly lines = this.form.controls.lines;

  protected readonly customers = signal<Customer[]>([]);
  private readonly allProducts = signal<Product[]>([]);
  private readonly licensedBrandIds = signal<Set<number> | null>(null);
  protected readonly fixedCustomerName = signal('');
  protected readonly error = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly submitted = signal(false);
  private readonly selectedCustomer = signal<number | null>(null);

  /** Products the chosen customer may order. Customers already get a filtered catalog from the API. */
  protected readonly products = computed(() => {
    const brands = this.licensedBrandIds();
    const products = this.allProducts();
    return brands === null ? products : products.filter((p) => brands.has(p.brandId));
  });

  protected readonly needsCustomer = computed(
    () => this.auth.isStaff() && !this.id() && this.selectedCustomer() === null,
  );

  private readonly prices = computed(
    () => new Map(this.allProducts().map((p) => [p.id, p.unitPrice])),
  );
  private readonly lineValues = toSignal(
    this.lines.valueChanges.pipe(map(() => this.lines.getRawValue())),
    {
      initialValue: [],
    },
  );
  protected readonly total = computed(() => orderTotal(this.lineValues(), this.prices()));

  ngOnInit(): void {
    if (this.auth.isStaff()) {
      this.form.controls.customerId.addValidators(Validators.required);
    }
    const products$ = this.productApi.search({ size: 200 }).pipe(map((page) => page.content));
    const customers$ = this.auth.isStaff() && !this.id() ? this.customerApi.findAll() : of([]);

    forkJoin([products$, customers$]).subscribe({
      next: ([products, customers]) => {
        this.allProducts.set(products);
        this.customers.set(customers);
        if (this.id()) {
          this.loadOrder(Number(this.id()));
        } else {
          const preset = this.productId() ? Number(this.productId()) : null;
          this.addLine(preset);
        }
      },
      error: (error: unknown) => this.error.set(errorMessage(error)),
    });
  }

  protected onCustomerChange(): void {
    const customerId = this.form.controls.customerId.value;
    this.selectedCustomer.set(customerId);
    if (customerId !== null) {
      this.loadLicenses(customerId);
    }
  }

  protected addLine(productId: number | null = null, quantity = 1): void {
    this.lines.push(
      this.fb.group({
        productId: this.fb.control<number | null>(productId, Validators.required),
        quantity: this.fb.nonNullable.control(quantity, [
          Validators.required,
          Validators.min(1),
          Validators.max(10000),
          Validators.pattern(/^\d+$/),
        ]),
      }),
    );
  }

  protected removeLine(index: number): void {
    this.lines.removeAt(index);
  }

  protected priceOf(productId: number | null): number | null {
    return productId === null ? null : (this.prices().get(productId) ?? null);
  }

  protected lineTotal(index: number): number | null {
    const line = this.lineValues()[index];
    return line ? orderTotal([line], this.prices()) : null;
  }

  protected submit(): void {
    this.submitted.set(true);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const lines: OrderLineRequest[] = this.lines.getRawValue().map((line) => ({
      productId: line.productId as number,
      quantity: Number(line.quantity),
    }));
    const request$ = this.id()
      ? this.orderApi.replaceLines(Number(this.id()), lines)
      : this.orderApi.create(this.form.controls.customerId.value, lines);

    this.saving.set(true);
    this.error.set(null);
    request$.subscribe({
      next: (order) => void this.router.navigate(['/orders', order.id]),
      error: (error: unknown) => {
        this.error.set(errorMessage(error));
        this.saving.set(false);
      },
    });
  }

  private loadOrder(id: number): void {
    this.orderApi.findById(id).subscribe({
      next: (order) => {
        if (!order.availableActions.includes('EDIT_LINES')) {
          this.error.set('Este pedido ya no se puede editar: solo los borradores admiten cambios.');
          return;
        }
        this.fixedCustomerName.set(order.customerName);
        this.form.controls.customerId.setValue(order.customerId);
        this.selectedCustomer.set(order.customerId);
        if (this.auth.isStaff()) {
          this.loadLicenses(order.customerId);
        }
        order.lines.forEach((line) => this.addLine(line.productId, line.quantity));
      },
      error: (error: unknown) => this.error.set(errorMessage(error)),
    });
  }

  private loadLicenses(customerId: number): void {
    this.customerApi.licenses(customerId).subscribe({
      next: (licenses) =>
        this.licensedBrandIds.set(
          new Set(licenses.filter((l) => l.validToday).map((l) => l.brandId)),
        ),
      error: (error: unknown) => this.error.set(errorMessage(error)),
    });
  }
}
