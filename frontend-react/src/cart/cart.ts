import type { Product } from '../api/types'

export interface CartLine {
  product: Product
  quantity: number
}

export type CartAction =
  | { type: 'add'; product: Product; quantity: number }
  | { type: 'setQuantity'; productId: number; quantity: number }
  | { type: 'remove'; productId: number }
  | { type: 'clear' }

export const MAX_QUANTITY = 10000

const clamp = (quantity: number) => Math.min(MAX_QUANTITY, Math.max(1, Math.floor(quantity)))

export function cartReducer(lines: CartLine[], action: CartAction): CartLine[] {
  switch (action.type) {
    case 'add': {
      const existing = lines.find((line) => line.product.id === action.product.id)
      if (existing) {
        return lines.map((line) =>
          line === existing ? { ...line, quantity: clamp(line.quantity + action.quantity) } : line,
        )
      }
      return [...lines, { product: action.product, quantity: clamp(action.quantity) }]
    }
    case 'setQuantity':
      return lines.map((line) =>
        line.product.id === action.productId ? { ...line, quantity: clamp(action.quantity) } : line,
      )
    case 'remove':
      return lines.filter((line) => line.product.id !== action.productId)
    case 'clear':
      return []
  }
}

// in cents to avoid floating point errors
export function cartTotal(lines: CartLine[]): number {
  const cents = lines.reduce((sum, line) => sum + Math.round(line.product.unitPrice * 100) * line.quantity, 0)
  return cents / 100
}
