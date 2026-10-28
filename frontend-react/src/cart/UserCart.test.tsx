import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { AuthProvider, useAuth } from '../auth/AuthContext'
import { loginAsCustomer } from '../test/render'
import { UserCart, useCart } from './CartContext'

function Probe() {
  const { units, dispatch } = useCart()
  const { logout } = useAuth()
  const product = { id: 1, sku: 'A', name: 'A', brandId: 1, brandName: 'B', unitPrice: 1, stock: 9 }
  return (
    <>
      <p>Unidades: {units}</p>
      <button onClick={() => dispatch({ type: 'add', product, quantity: 3 })}>Añadir</button>
      <button onClick={logout}>Salir</button>
    </>
  )
}

describe('UserCart', () => {
  it('starts empty again after any logout, so the next person does not inherit the cart', async () => {
    loginAsCustomer()
    render(
      <QueryClientProvider client={new QueryClient()}>
        <AuthProvider>
          <UserCart>
            <Probe />
          </UserCart>
        </AuthProvider>
      </QueryClientProvider>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Añadir' }))
    expect(screen.getByText('Unidades: 3')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Salir' }))
    expect(screen.getByText('Unidades: 0')).toBeInTheDocument()
  })
})
