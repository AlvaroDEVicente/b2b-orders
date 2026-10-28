// Shapes of the API's JSON, the subset this portal uses.

export type Role = 'ADMIN' | 'SALES' | 'CUSTOMER'
export type OrderStatus = 'DRAFT' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
export type OrderAction = 'EDIT_LINES' | 'CONFIRM' | 'CANCEL' | 'SHIP' | 'DELIVER'

export interface User {
  id: number
  email: string
  fullName: string
  role: Role
  customerId: number | null
}

export interface LoginResponse {
  token: string
  expiresAt: string
  user: User
}

export interface Page<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface Brand {
  id: number
  name: string
}

export interface Product {
  id: number
  sku: string
  name: string
  brandId: number
  brandName: string
  unitPrice: number
  stock: number
}

export interface OrderSummary {
  id: number
  status: OrderStatus
  total: number
  createdAt: string
  confirmedAt: string | null
}

export interface OrderLine {
  productId: number
  sku: string
  productName: string
  brandName: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

export interface Order extends OrderSummary {
  customerName: string
  createdByName: string
  lines: OrderLine[]
  availableActions: OrderAction[]
}

export interface Problem {
  title?: string
  status?: number
  detail?: string
  errors?: Record<string, string>
}
