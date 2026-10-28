import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ReportApi } from '../../core/api/api.services';
import { RoyaltyReport } from '../../core/api/models';
import { errorMessage } from '../../core/api/problem';
import { dateRangeValidator } from '../../shared/validators';

function currentQuarter(today = new Date()): { from: string; to: string } {
  const year = today.getFullYear();
  const firstMonth = Math.floor(today.getMonth() / 3) * 3;
  const pad = (n: number) => String(n).padStart(2, '0');
  const lastDay = new Date(year, firstMonth + 3, 0).getDate();
  return {
    from: `${year}-${pad(firstMonth + 1)}-01`,
    to: `${year}-${pad(firstMonth + 3)}-${pad(lastDay)}`,
  };
}

@Component({
  selector: 'app-royalties',
  imports: [ReactiveFormsModule, CurrencyPipe, DatePipe, DecimalPipe],
  template: `
    <div class="page-head">
      <h1>Royalties por marca</h1>
    </div>
    <p class="muted intro">
      Ventas de pedidos confirmados, enviados o entregados, por la fecha en que se confirmaron. Cada
      marca cobra su porcentaje sobre esas ventas.
    </p>

    <form class="period" [formGroup]="form" (ngSubmit)="load()" novalidate>
      <div>
        <label for="from">Desde</label>
        <input id="from" type="date" formControlName="startDate" />
      </div>
      <div>
        <label for="to">Hasta</label>
        <input id="to" type="date" formControlName="endDate" />
      </div>
      <button type="submit" [disabled]="form.invalid">Calcular</button>
    </form>
    @if (form.hasError('dateRange')) {
      <p class="field-error">La fecha final no puede ser anterior a la inicial.</p>
    }

    @if (error(); as message) {
      <p class="alert" role="alert">{{ message }}</p>
    }

    @if (report(); as report) {
      <h2>{{ report.from | date: 'd MMM y' }} a {{ report.to | date: 'd MMM y' }}</h2>
      @if (report.rows.length === 0) {
        <div class="panel empty">No hubo ventas confirmadas en este periodo.</div>
      } @else {
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Marca</th>
                <th class="num">Unidades</th>
                <th class="num">Ventas netas</th>
                <th class="num">Royalty</th>
                <th class="num">A pagar</th>
              </tr>
            </thead>
            <tbody>
              @for (row of report.rows; track row.brandId) {
                <tr>
                  <td>{{ row.brandName }}</td>
                  <td class="num">{{ row.units | number }}</td>
                  <td class="num">{{ row.netSales | currency: 'EUR' }}</td>
                  <td class="num">{{ row.royaltyRate | number: '1.2-2' }} %</td>
                  <td class="num">{{ row.royalty | currency: 'EUR' }}</td>
                </tr>
              }
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2">Total</td>
                <td class="num">{{ report.totalNetSales | currency: 'EUR' }}</td>
                <td></td>
                <td class="num">{{ report.totalRoyalty | currency: 'EUR' }}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      }
    }
  `,
  styles: `
    .intro {
      max-width: 60ch;
    }
    .period {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      gap: 1rem;
      margin: 1rem 0 1.5rem;
    }
    .period > div {
      width: 11rem;
    }
  `,
})
export class Royalties {
  private readonly api = inject(ReportApi);

  protected readonly report = signal<RoyaltyReport | null>(null);
  protected readonly error = signal<string | null>(null);

  private readonly quarter = currentQuarter();
  protected readonly form = inject(FormBuilder).nonNullable.group(
    {
      startDate: [this.quarter.from, Validators.required],
      endDate: [this.quarter.to, Validators.required],
    },
    { validators: dateRangeValidator },
  );

  constructor() {
    this.load();
  }

  protected load(): void {
    const { startDate, endDate } = this.form.getRawValue();
    this.error.set(null);
    this.api.royalties(startDate, endDate).subscribe({
      next: (report) => this.report.set(report),
      error: (error: unknown) => this.error.set(errorMessage(error)),
    });
  }
}
