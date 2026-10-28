import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderPage } from '../test/render'
import { LoginPage } from './LoginPage'

function apiAnswers(user: { role: string }) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          token: 'jwt-token',
          expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
          user: { id: 1, email: 'x@example.com', fullName: 'X', customerId: null, ...user },
        }),
        { status: 200 },
      ),
    ),
  )
}

describe('LoginPage', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('asks for both fields before calling the API', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    renderPage(<LoginPage />, { path: '/login', url: '/login' })

    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Escribe tu email y tu contraseña')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('lets distributors in', async () => {
    apiAnswers({ role: 'CUSTOMER' })
    renderPage(<LoginPage />, { path: '/login', url: '/login' })

    await userEvent.type(screen.getByLabelText('Email'), 'cliente.cantabrico@example.com')
    await userEvent.type(screen.getByLabelText('Contraseña'), 'demo1234')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText('Otra página')).toBeInTheDocument()
  })

  it('turns back staff users: this portal is only for distributors', async () => {
    apiAnswers({ role: 'ADMIN' })
    renderPage(<LoginPage />, { path: '/login', url: '/login' })

    await userEvent.type(screen.getByLabelText('Email'), 'admin@example.com')
    await userEvent.type(screen.getByLabelText('Contraseña'), 'demo1234')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Este portal es para distribuidores')
    expect(localStorage.getItem('b2b-orders.portal.session')).toBeNull()
  })
})
