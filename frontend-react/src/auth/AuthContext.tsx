import { useQueryClient } from '@tanstack/react-query'
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { configureClient } from '../api/client'
import { login as loginRequest } from '../api/endpoints'
import type { User } from '../api/types'

const STORAGE_KEY = 'b2b-orders.portal.session'

interface Session {
  token: string
  expiresAt: string
  user: User
}

interface AuthValue {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

// oxlint-disable-next-line react/only-export-components
export class NotACustomerError extends Error {
  constructor() {
    super('Este portal es para distribuidores. El personal interno entra por el back-office (Angular).')
  }
}

const AuthContext = createContext<AuthValue | null>(null)

function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const session = JSON.parse(raw) as Session
    return new Date(session.expiresAt).getTime() > Date.now() ? session : null
  } catch {
    return null
  }
}

function writeSession(session: Session | null): void {
  try {
    if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    else localStorage.removeItem(STORAGE_KEY)
  } catch {}
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [session, setSession] = useState<Session | null>(readSession)

  const logout = useCallback(() => {
    writeSession(null)
    setSession(null)
    queryClient.clear()
  }, [queryClient])

  // set during render, not in an effect: effects run children first, so a query could fire without the token
  configureClient(session?.token ?? null, logout)

  const login = useCallback(async (email: string, password: string) => {
    const response = await loginRequest(email, password)
    if (response.user.role !== 'CUSTOMER') {
      throw new NotACustomerError()
    }
    const next = { token: response.token, expiresAt: response.expiresAt, user: response.user }
    writeSession(next)
    setSession(next)
  }, [])

  const value = useMemo(() => ({ user: session?.user ?? null, login, logout }), [session, login, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// oxlint-disable-next-line react/only-export-components
export function useAuth(): AuthValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>')
  return value
}
