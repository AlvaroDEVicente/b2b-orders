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

// new key per user = fresh cart after any logout
export function UserCart({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  return <CartProvider key={user?.id ?? 'anonymous'}>{children}</CartProvider>
}

// oxlint-disable-next-line react/only-export-components
export function useCart(): CartValue {
  const value = useContext(CartContext)
  if (!value) throw new Error('useCart must be used inside <CartProvider>')
  return value
}
