// TypeScript mirror of the API's JSON. Keeping it in one file makes a contract change easy to spot.

export type Role = 'ADMIN' | 'SALES' | 'CUSTOMER';

export type OrderStatus = 'DRAFT' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export type OrderAction = 'EDIT_LINES' | 'CONFIRM' | 'CANCEL' | 'SHIP' | 'DELIVER';

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: Role;
  customerId: number | null;
}

export interface LoginResponse {
  token: string;
  expiresAt: string;
  user: User;
}

export interface Page<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface Brand {
  id: number;
  name: string;
  royaltyRate: number;
  active: boolean;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  brandId: number;
  brandName: string;
  unitPrice: number;
  stock: number;
  active: boolean;
}

export interface Customer {
  id: number;
  name: string;
  taxId: string;
  email: string;
  phone: string | null;
  city: string;
  salesRepId: number | null;
  salesRepName: string | null;
  active: boolean;
}

export interface License {
  id: number;
  customerId: number;
  customerName: string;
  brandId: number;
  brandName: string;
  startDate: string;
  endDate: string;
  validToday: boolean;
}

export interface LicenseRequest {
  customerId: number;
  brandId: number;
  startDate: string;
  endDate: string;
}

export interface OrderSummary {
  id: number;
  customerId: number;
  customerName: string;
  status: OrderStatus;
  total: number;
  createdAt: string;
  confirmedAt: string | null;
}

export interface OrderLine {
  productId: number;
  sku: string;
  productName: string;
  brandName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Order {
  id: number;
  customerId: number;
  customerName: string;
  createdByName: string;
  status: OrderStatus;
  total: number;
  createdAt: string;
  confirmedAt: string | null;
  updatedAt: string;
  lines: OrderLine[];
  availableActions: OrderAction[];
}

export interface OrderLineRequest {
  productId: number;
  quantity: number;
}

export interface RoyaltyRow {
  brandId: number;
  brandName: string;
  royaltyRate: number;
  units: number;
  netSales: number;
  royalty: number;
}

export interface RoyaltyReport {
  from: string;
  to: string;
  rows: RoyaltyRow[];
  totalNetSales: number;
  totalRoyalty: number;
}

/** RFC 9457 error body returned by the API. */
export interface Problem {
  title?: string;
  status?: number;
  detail?: string;
  errors?: Record<string, string>;
}
