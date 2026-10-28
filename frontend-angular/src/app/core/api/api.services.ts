import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Brand,
  Customer,
  License,
  LicenseRequest,
  Order,
  OrderLineRequest,
  OrderStatus,
  OrderSummary,
  Page,
  Product,
  RoyaltyReport,
} from './models';

/**
 * Thin wrappers around the REST endpoints. Components never build URLs themselves, so if an
 * endpoint changes there is one place to fix. All URLs are relative ("/api/..."): in development the
 * Angular dev server proxies them to the API, in production nginx does.
 */

@Injectable({ providedIn: 'root' })
export class ProductApi {
  private readonly http = inject(HttpClient);

  search(filters: {
    q?: string;
    brandId?: number | null;
    page?: number;
    size?: number;
  }): Observable<Page<Product>> {
    let params = new HttpParams().set('page', filters.page ?? 0).set('size', filters.size ?? 20);
    if (filters.q) {
      params = params.set('q', filters.q);
    }
    if (filters.brandId) {
      params = params.set('brandId', filters.brandId);
    }
    return this.http.get<Page<Product>>('/api/products', { params });
  }
}

@Injectable({ providedIn: 'root' })
export class BrandApi {
  private readonly http = inject(HttpClient);

  findAll(): Observable<Brand[]> {
    return this.http.get<Brand[]>('/api/brands');
  }
}

@Injectable({ providedIn: 'root' })
export class CustomerApi {
  private readonly http = inject(HttpClient);

  findAll(): Observable<Customer[]> {
    return this.http.get<Customer[]>('/api/customers');
  }

  findById(id: number): Observable<Customer> {
    return this.http.get<Customer>(`/api/customers/${id}`);
  }

  licenses(id: number): Observable<License[]> {
    return this.http.get<License[]>(`/api/customers/${id}/licenses`);
  }

  grantLicense(request: LicenseRequest): Observable<License> {
    return this.http.post<License>('/api/licenses', request);
  }

  revokeLicense(id: number): Observable<void> {
    return this.http.delete<void>(`/api/licenses/${id}`);
  }
}

export type OrderTransition = 'confirm' | 'cancel' | 'ship' | 'deliver';

@Injectable({ providedIn: 'root' })
export class OrderApi {
  private readonly http = inject(HttpClient);

  search(filters: {
    status?: OrderStatus | null;
    page?: number;
    size?: number;
  }): Observable<Page<OrderSummary>> {
    let params = new HttpParams().set('page', filters.page ?? 0).set('size', filters.size ?? 20);
    if (filters.status) {
      params = params.set('status', filters.status);
    }
    return this.http.get<Page<OrderSummary>>('/api/orders', { params });
  }

  findById(id: number): Observable<Order> {
    return this.http.get<Order>(`/api/orders/${id}`);
  }

  create(customerId: number | null, lines: OrderLineRequest[]): Observable<Order> {
    return this.http.post<Order>('/api/orders', { customerId, lines });
  }

  replaceLines(id: number, lines: OrderLineRequest[]): Observable<Order> {
    return this.http.put<Order>(`/api/orders/${id}/lines`, { lines });
  }

  transition(id: number, action: OrderTransition): Observable<Order> {
    return this.http.post<Order>(`/api/orders/${id}/${action}`, {});
  }
}

@Injectable({ providedIn: 'root' })
export class ReportApi {
  private readonly http = inject(HttpClient);

  royalties(from: string, to: string): Observable<RoyaltyReport> {
    return this.http.get<RoyaltyReport>('/api/reports/royalties', { params: { from, to } });
  }
}
