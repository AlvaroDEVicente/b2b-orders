import { createContext, useContext, useMemo, useReducer, type Dispatch, type ReactNode } from 'react'
import { useAuth } from '../auth/AuthContext'
import { cartReducer, cartTotal, type CartAction, type CartLine } from './cart'

interface CartValue {
  lines: CartLine[]
  total: number
  units: number
  dispatch: Dispatch<CartAction>
}

const CartContext = createContext<CartValue | null>(null)

/**
 * The cart lives only in memory: it is a draft of an order, the real draft is created in the API.
 * It is keyed by user (see UserCart), so any logout, including one forced by an expired token,
 * starts the next session with an empty cart.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, dispatch] = useReducer(cartReducer, [])
  const value = useMemo(
    () => ({
      lines,
      dispatch,
      total: cartTotal(lines),
      units: lines.reduce((sum, line) => sum + line.quantity, 0),
    }),
    [lines],
  )
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

/** A new `key` makes React throw away the old provider and its state: one cart per user. */
export function UserCart({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  return <CartProvider key={user?.id ?? 'anonymous'}>{children}</CartProvider>
}

// Hooks and errors live next to their provider on purpose; fast refresh simply reloads this file.
// oxlint-disable-next-line react/only-export-components
export function useCart(): CartValue {
  const value = useContext(CartContext)
  if (!value) throw new Error('useCart must be used inside <CartProvider>')
  return value
}
