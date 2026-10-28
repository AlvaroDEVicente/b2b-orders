import { describe, expect, it } from 'vitest'
import type { Product } from '../api/types'
import { cartReducer, cartTotal, type CartLine } from './cart'

const product = (id: number, unitPrice: number): Product => ({
  id,
  sku: `SKU-${id}`,
  name: `Producto ${id}`,
  brandId: 1,
  brandName: 'Kraken Sports',
  unitPrice,
  stock: 100,
})

describe('cartReducer', () => {
  it('adds a new product as a new line', () => {
    const lines = cartReducer([], { type: 'add', product: product(1, 9.9), quantity: 3 })
    expect(lines).toHaveLength(1)
    expect(lines[0].quantity).toBe(3)
  })

  it('adding the same product again adds to its quantity instead of creating a second line', () => {
    let lines = cartReducer([], { type: 'add', product: product(1, 9.9), quantity: 3 })
    lines = cartReducer(lines, { type: 'add', product: product(1, 9.9), quantity: 2 })
    expect(lines).toHaveLength(1)
    expect(lines[0].quantity).toBe(5)
  })

  it('never mutates the previous state', () => {
    const before: CartLine[] = [{ product: product(1, 9.9), quantity: 1 }]
    const after = cartReducer(before, { type: 'setQuantity', productId: 1, quantity: 4 })
    expect(before[0].quantity).toBe(1)
    expect(after).not.toBe(before)
  })

  it('keeps quantities between 1 and 10000', () => {
    const lines: CartLine[] = [{ product: product(1, 9.9), quantity: 1 }]
    expect(cartReducer(lines, { type: 'setQuantity', productId: 1, quantity: 0 })[0].quantity).toBe(1)
    expect(cartReducer(lines, { type: 'setQuantity', productId: 1, quantity: 99999 })[0].quantity).toBe(10000)
  })

  it('removes and clears', () => {
    const lines: CartLine[] = [
      { product: product(1, 9.9), quantity: 1 },
      { product: product(2, 4.2), quantity: 1 },
    ]
    expect(cartReducer(lines, { type: 'remove', productId: 1 }).map((l) => l.product.id)).toEqual([2])
    expect(cartReducer(lines, { type: 'clear' })).toEqual([])
  })
})

describe('cartTotal', () => {
  it('adds up in cents, so 0.1 + 0.2 is exactly 0.3', () => {
    expect(
      cartTotal([
        { product: product(1, 0.1), quantity: 1 },
        { product: product(2, 0.2), quantity: 1 },
      ]),
    ).toBe(0.3)
  })
})
