import { api } from './client'
import type { Brand, LoginResponse, Order, OrderStatus, OrderSummary, Page, Product } from './types'

export interface LineRequest {
  productId: number
  quantity: number
}

export const login = (email: string, password: string) =>
  api<LoginResponse>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })

export const fetchBrands = () => api<Brand[]>('/api/brands')

export function fetchProducts(filters: { q: string; brandId: number | null; page: number }) {
  const params = new URLSearchParams({ page: String(filters.page), size: '12' })
  if (filters.q) params.set('q', filters.q)
  if (filters.brandId) params.set('brandId', String(filters.brandId))
  return api<Page<Product>>(`/api/products?${params}`)
}

export function fetchOrders(filters: { status: OrderStatus | null; page: number }) {
  const params = new URLSearchParams({ page: String(filters.page), size: '10' })
  if (filters.status) params.set('status', filters.status)
  return api<Page<OrderSummary>>(`/api/orders?${params}`)
}

export const fetchOrder = (id: number) => api<Order>(`/api/orders/${id}`)

/** The API takes the customer from the token for CUSTOMER users, so no customerId is sent. */
export const createOrder = (lines: LineRequest[]) =>
  api<Order>('/api/orders', { method: 'POST', body: JSON.stringify({ lines }) })

export const confirmOrder = (id: number) => api<Order>(`/api/orders/${id}/confirm`, { method: 'POST' })

export const cancelOrder = (id: number) => api<Order>(`/api/orders/${id}/cancel`, { method: 'POST' })
