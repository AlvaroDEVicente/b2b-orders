import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { AuthProvider } from '../auth/AuthContext'
import { CartProvider } from '../cart/CartContext'

/** Renders a page with every provider the app has, at the given URL. */
export function renderPage(element: ReactElement, { path = '/', url = '/' } = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[url]}>
        <AuthProvider>
          <CartProvider>
            <Routes>
              <Route path={path} element={element} />
              <Route path="*" element={<p>Otra página</p>} />
            </Routes>
          </CartProvider>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

/** Puts a valid session in storage, as if the user had logged in before. */
export function loginAsCustomer() {
  localStorage.setItem(
    'b2b-orders.portal.session',
    JSON.stringify({
      token: 'jwt-token',
      expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
      user: {
        id: 4,
        email: 'cliente@example.com',
        fullName: 'Pablo Herrera',
        role: 'CUSTOMER',
        customerId: 1,
      },
    }),
  )
}
