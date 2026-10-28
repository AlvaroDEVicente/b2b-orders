import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Order } from '../api/types'
import { loginAsCustomer, renderPage } from '../test/render'
import { OrderPage } from './OrderPage'

const draft: Order = {
  id: 9,
  status: 'DRAFT',
  total: 99,
  createdAt: '2026-10-28T10:00:00Z',
  confirmedAt: null,
  customerName: 'Móviles del Cantábrico S.L.',
  createdByName: 'Pablo Herrera',
  availableActions: ['EDIT_LINES', 'CONFIRM', 'CANCEL'],
  lines: [
    {
      productId: 1,
      sku: 'KRK-CAS-IP17',
      productName: 'Carcasa Kraken Sports iPhone 17',
      brandName: 'Kraken Sports',
      quantity: 10,
      unitPrice: 9.9,
      lineTotal: 99,
    },
  ],
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })

describe('OrderPage', () => {
  beforeEach(loginAsCustomer)
  afterEach(() => vi.unstubAllGlobals())

  it('shows only the actions the API allows', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async () => json({ ...draft, status: 'CONFIRMED', availableActions: [] })),
    )
    renderPage(<OrderPage />, { path: '/pedidos/:id', url: '/pedidos/9' })

    expect(await screen.findByRole('heading', { name: 'Pedido 9' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Confirmar pedido' })).not.toBeInTheDocument()
    expect(screen.getByText(/habla con tu comercial/)).toBeInTheDocument()
  })

  it('confirms a draft and shows the new status', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json(draft))
      .mockImplementation(async () => json({ ...draft, status: 'CONFIRMED', availableActions: [] }))
    vi.stubGlobal('fetch', fetchMock)
    renderPage(<OrderPage />, { path: '/pedidos/:id', url: '/pedidos/9' })

    await userEvent.click(await screen.findByRole('button', { name: 'Confirmar pedido' }))

    expect(await screen.findByText(/habla con tu comercial/)).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/orders/9/confirm',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('shows the API error when confirming fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(json(draft))
        .mockImplementation(async () => json({ detail: 'Stock insuficiente para KRK-CAS-IP17' }, 409)),
    )
    renderPage(<OrderPage />, { path: '/pedidos/:id', url: '/pedidos/9' })

    await userEvent.click(await screen.findByRole('button', { name: 'Confirmar pedido' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Stock insuficiente para KRK-CAS-IP17')
  })
})
