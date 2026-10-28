import type { OrderStatus } from './api/types'

const euros = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' })
const dateTime = new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium', timeStyle: 'short' })

export const formatMoney = (value: number) => euros.format(value)
export const formatDateTime = (iso: string) => dateTime.format(new Date(iso))

export const STATUS_LABELS: Record<OrderStatus, string> = {
  DRAFT: 'Borrador',
  CONFIRMED: 'Confirmado',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
}
