import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { License, Page, Product } from '../../core/api/models';
import { AuthService } from '../../core/auth/auth.service';
import { OrderForm } from './order-form';

const product = (id: number, brandId: number): Product => ({
  id,
  sku: `SKU-${id}`,
  name: `Producto ${id}`,
  brandId,
  brandName: `Marca ${brandId}`,
  unitPrice: 10,
  stock: 100,
  active: true,
});

const license = (brandId: number): License => ({
  id: brandId,
  customerId: 1,
  customerName: 'Cliente',
  brandId,
  brandName: `Marca ${brandId}`,
  startDate: '2026-01-01',
  endDate: '2028-12-31',
  validToday: true,
});

interface FormInternals {
  form: { controls: { customerId: { setValue(v: number | null): void } } };
  lines: {
    controls: {
      controls: { productId: { value: number | null; setValue(v: number | null): void } };
    }[];
  };
  onCustomerChange(): void;
  products(): Product[];
  notice(): string | null;
}

describe('OrderForm for a sales rep', () => {
  let http: HttpTestingController;
  let form: FormInternals;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AuthService, useValue: { isStaff: signal(true), user: signal(null) } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(OrderForm);
    fixture.detectChanges();
    form = fixture.componentInstance as unknown as FormInternals;

    const page: Page<Product> = {
      content: [product(10, 1), product(20, 2)],
      page: 0,
      size: 200,
      totalElements: 2,
      totalPages: 1,
    };
    http.expectOne((r) => r.url === '/api/products').flush(page);
    http.expectOne('/api/customers').flush([]);
  });

  afterEach(() => http.verify());

  function chooseCustomer(id: number): void {
    form.form.controls.customerId.setValue(id);
    form.onCustomerChange();
  }

  it('offers nothing until the chosen customer licenses arrive, then only their brands', () => {
    chooseCustomer(1);
    expect(form.products()).toEqual([]);

    http.expectOne('/api/customers/1/licenses').flush([license(1)]);
    expect(form.products().map((p) => p.id)).toEqual([10]);
  });

  it('empties lines the new customer cannot order', () => {
    chooseCustomer(1);
    http.expectOne('/api/customers/1/licenses').flush([license(1)]);
    form.lines.controls[0].controls.productId.setValue(10);

    chooseCustomer(2);
    http.expectOne('/api/customers/2/licenses').flush([license(2)]);

    expect(form.lines.controls[0].controls.productId.value).toBeNull();
    expect(form.notice()).toContain('Se han vaciado');
  });

  it('cancels the licenses request of a customer that is no longer selected', () => {
    chooseCustomer(1);
    const first = http.expectOne('/api/customers/1/licenses');
    chooseCustomer(2);
    http.expectOne('/api/customers/2/licenses').flush([license(2)]);

    expect(first.cancelled).toBe(true);
    expect(form.products().map((p) => p.id)).toEqual([20]);
  });
});
