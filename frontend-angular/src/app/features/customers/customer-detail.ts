import { DatePipe } from '@angular/common';
import { Component, effect, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { of } from 'rxjs';
import { BrandApi, CustomerApi } from '../../core/api/api.services';
import { Customer, License } from '../../core/api/models';
import { errorMessage } from '../../core/api/problem';
import { AuthService } from '../../core/auth/auth.service';
import { dateRangeValidator } from '../../shared/validators';

@Component({
  selector: 'app-customer-detail',
  imports: [ReactiveFormsModule, RouterLink, DatePipe],
  template: `
    @if (auth.isStaff()) {
      <p><a routerLink="/customers">Volver a clientes</a></p>
    }

    @if (error(); as message) {
      <p class="alert" role="alert">{{ message }}</p>
    }

    @if (customer(); as customer) {
      <div class="page-head">
        <h1>{{ customer.name }}</h1>
      </div>

      <section class="panel facts">
        <dl>
          <div>
            <dt>CIF</dt>
            <dd>{{ customer.taxId }}</dd>
          </div>
          <div>
            <dt>Ciudad</dt>
            <dd>{{ customer.city }}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{{ customer.email }}</dd>
          </div>
          <div>
            <dt>Teléfono</dt>
            <dd>{{ customer.phone ?? 'Sin teléfono' }}</dd>
          </div>
          <div>
            <dt>Comercial</dt>
            <dd>{{ customer.salesRepName ?? 'Sin asignar' }}</dd>
          </div>
        </dl>
      </section>

      <h2>Licencias de marca</h2>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Marca</th>
              <th>Desde</th>
              <th>Hasta</th>
              <th>Hoy</th>
              @if (isAdmin) {
                <th><span class="visually-hidden">Acción</span></th>
              }
            </tr>
          </thead>
          <tbody>
            @for (license of licenses(); track license.id) {
              <tr>
                <td>{{ license.brandName }}</td>
                <td>{{ license.startDate | date: 'd MMM y' }}</td>
                <td>{{ license.endDate | date: 'd MMM y' }}</td>
                <td [class.valid]="license.validToday">
                  {{ license.validToday ? 'En vigor' : 'No vigente' }}
                </td>
                @if (isAdmin) {
                  <td>
                    <button type="button" class="link" (click)="revoke(license)">Retirar</button>
                  </td>
                }
              </tr>
            } @empty {
              <tr>
                <td colspan="5" class="empty">Este cliente no tiene licencias.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      @if (isAdmin) {
        <form class="panel grant" [formGroup]="form" (ngSubmit)="grant()" novalidate>
          <h2>Conceder licencia</h2>
          <div class="row">
            <div class="field">
              <label for="brand">Marca</label>
              <select id="brand" formControlName="brandId">
                <option [ngValue]="null" disabled>Elige una marca</option>
                @for (brand of brands(); track brand.id) {
                  <option [ngValue]="brand.id">{{ brand.name }} ({{ brand.royaltyRate }} %)</option>
                }
              </select>
            </div>
            <div class="field">
              <label for="start">Desde</label>
              <input id="start" type="date" formControlName="startDate" />
            </div>
            <div class="field">
              <label for="end">Hasta</label>
              <input id="end" type="date" formControlName="endDate" />
            </div>
          </div>
          @if (form.hasError('dateRange')) {
            <p class="field-error">La fecha de fin no puede ser anterior a la de inicio.</p>
          }
          <button type="submit" [disabled]="form.invalid || saving()">Conceder licencia</button>
        </form>
      }
    } @else if (!error()) {
      <p class="muted">Cargando cliente…</p>
    }
  `,
  styles: `
    .facts {
      margin-bottom: 1.5rem;
    }
    dl {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
      gap: 1rem;
      margin: 0;
    }
    dt {
      font-size: 0.8125rem;
      color: var(--muted);
    }
    dd {
      margin: 0;
      font-weight: 600;
      overflow-wrap: anywhere;
    }
    .valid {
      color: var(--ok);
      font-weight: 600;
    }
    .grant {
      margin-top: 1.5rem;
      max-width: 44rem;
    }
    .row {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr;
      gap: 1rem;
    }
    .visually-hidden {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
    }
    @media (max-width: 600px) {
      .row {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class CustomerDetail {
  private readonly api = inject(CustomerApi);
  protected readonly auth = inject(AuthService);
  protected readonly isAdmin = this.auth.hasRole('ADMIN');

  readonly id = input.required<string>();

  protected readonly customer = signal<Customer | null>(null);
  protected readonly licenses = signal<License[]>([]);
  protected readonly error = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly brands = toSignal(this.isAdmin ? inject(BrandApi).findAll() : of([]), {
    initialValue: [],
  });

  protected readonly form = inject(FormBuilder).group(
    {
      brandId: [null as number | null, Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
    },
    { validators: dateRangeValidator },
  );

  constructor() {
    effect(() => {
      const id = Number(this.id());
      this.error.set(null);
      this.api.findById(id).subscribe({
        next: (customer) => this.customer.set(customer),
        error: (error: unknown) => this.error.set(errorMessage(error)),
      });
      this.loadLicenses(id);
    });
  }

  protected grant(): void {
    const { brandId, startDate, endDate } = this.form.getRawValue();
    if (this.form.invalid || brandId === null || !startDate || !endDate) {
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    this.api
      .grantLicense({ customerId: Number(this.id()), brandId, startDate, endDate })
      .subscribe({
        next: () => {
          this.form.reset();
          this.saving.set(false);
          this.loadLicenses(Number(this.id()));
        },
        error: (error: unknown) => {
          this.error.set(errorMessage(error));
          this.saving.set(false);
        },
      });
  }

  protected revoke(license: License): void {
    if (!window.confirm(`¿Retirar la licencia de ${license.brandName}?`)) {
      return;
    }
    this.api.revokeLicense(license.id).subscribe({
      next: () => this.loadLicenses(Number(this.id())),
      error: (error: unknown) => this.error.set(errorMessage(error)),
    });
  }

  private loadLicenses(id: number): void {
    this.api.licenses(id).subscribe({
      next: (licenses) => this.licenses.set(licenses),
      error: (error: unknown) => this.error.set(errorMessage(error)),
    });
  }
}
