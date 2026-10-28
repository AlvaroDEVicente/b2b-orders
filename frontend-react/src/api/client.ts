import type { Problem } from './types'

export class ApiError extends Error {
  readonly status: number
  readonly problem: Problem | null

  constructor(status: number, problem: Problem | null) {
    super(problem?.detail ?? `Error ${status}`)
    this.status = status
    this.problem = problem
  }
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.problem?.errors) {
      return Object.values(error.problem.errors).join('. ')
    }
    return error.problem?.detail ?? `Error ${error.status} del servidor.`
  }
  if (error instanceof TypeError) {
    return 'No hay conexión con el servidor. Comprueba que la API está arrancada.'
  }
  return 'Ha ocurrido un error inesperado.'
}

let currentToken: string | null = null
let onUnauthorized: () => void = () => {}

export function configureClient(token: string | null, unauthorizedHandler: () => void): void {
  currentToken = token
  onUnauthorized = unauthorizedHandler
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  if (init.body !== undefined) {
    headers.set('Content-Type', 'application/json')
  }
  if (currentToken && path !== '/api/auth/login') {
    headers.set('Authorization', `Bearer ${currentToken}`)
  }

  const response = await fetch(path, { ...init, headers })

  if (!response.ok) {
    const problem = (await response.json().catch(() => null)) as Problem | null
    if (response.status === 401 && path !== '/api/auth/login') {
      onUnauthorized()
    }
    throw new ApiError(response.status, problem)
  }
  if (response.status === 204) {
    return undefined as T
  }
  return (await response.json()) as T
}
