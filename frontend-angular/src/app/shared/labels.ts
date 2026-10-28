import { OrderStatus, Role } from '../core/api/models';

export const STATUS_LABELS: Record<OrderStatus, string> = {
  DRAFT: 'Borrador',
  CONFIRMED: 'Confirmado',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
};

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Administración',
  SALES: 'Comercial',
  CUSTOMER: 'Cliente',
};

/** The normal path of an order, in order. CANCELLED is not on it: it is a way out. */
export const LIFE_CYCLE: OrderStatus[] = ['DRAFT', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];
