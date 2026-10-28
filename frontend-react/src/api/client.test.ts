import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, api, configureClient, errorMessage } from './client'

function respond(status: number, body: unknown) {
  return vi.fn().mockResolvedValue(new Response(body === null ? null : JSON.stringify(body), { status }))
}

describe('api client', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    configureClient(null, () => {})
  })

  it('sends the bearer token and parses JSON', async () => {
    const fetchMock = respond(200, { id: 7 })
    vi.stubGlobal('fetch', fetchMock)
    configureClient('jwt-token', () => {})

    await expect(api('/api/orders/7')).resolves.toEqual({ id: 7 })
    const headers = fetchMock.mock.calls[0][1].headers as Headers
    expect(headers.get('Authorization')).toBe('Bearer jwt-token')
  })

  it('turns a problem response into an ApiError with its detail', async () => {
    vi.stubGlobal('fetch', respond(422, { title: 'Regla de negocio incumplida', detail: 'Sin licencia' }))

    const error = await api('/api/orders', { method: 'POST', body: '{}' }).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(errorMessage(error)).toBe('Sin licencia')
  })

  it('ends the session on 401', async () => {
    const onUnauthorized = vi.fn()
    vi.stubGlobal('fetch', respond(401, { detail: 'Token caducado' }))
    configureClient('old-token', onUnauthorized)

    await api('/api/orders').catch(() => undefined)
    expect(onUnauthorized).toHaveBeenCalledOnce()
  })

  it('explains a network failure', () => {
    expect(errorMessage(new TypeError('Failed to fetch'))).toContain('No hay conexión')
  })
})
