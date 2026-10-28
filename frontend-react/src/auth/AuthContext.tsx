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

/** Thrown when someone from the back office tries to use the distributors' portal. */
// Hooks and errors live next to their provider on purpose; fast refresh simply reloads this file.
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
  } catch {
    // Storage blocked (private mode): the session simply does not survive a reload.
  }
}

/**
 * Holds the session for the whole app. Any component calls useAuth() to know who is logged in.
 * Context is enough here: the session changes rarely (login, logout), so re-rendering its
 * consumers is cheap and no state library is needed.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [session, setSession] = useState<Session | null>(readSession)

  const logout = useCallback(() => {
    writeSession(null)
    setSession(null)
    // Cached data belongs to the previous user: never show it to the next one.
    queryClient.clear()
  }, [queryClient])

  // Configure the HTTP client during render, not in an effect: effects run children first, so a
  // child query could fire before the token is set. The assignment is idempotent, so it is safe.
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

// Hooks and errors live next to their provider on purpose; fast refresh simply reloads this file.
// oxlint-disable-next-line react/only-export-components
export function useAuth(): AuthValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>')
  return value
}
