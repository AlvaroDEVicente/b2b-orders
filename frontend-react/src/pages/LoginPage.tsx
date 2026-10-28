import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { errorMessage } from '../api/client'
import { NotACustomerError, useAuth } from '../auth/AuthContext'

const DEMO_USERS = [
  { email: 'cliente.cantabrico@example.com', label: 'Entrar como Móviles del Cantábrico' },
  { email: 'cliente.vera@example.com', label: 'Entrar como TecnoVera' },
]

export function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (user) {
    return <Navigate to="/catalogo" replace />
  }

  async function signIn(emailValue: string, passwordValue: string) {
    setLoading(true)
    setError(null)
    try {
      await login(emailValue, passwordValue)
      navigate('/catalogo')
    } catch (caught) {
      setError(caught instanceof NotACustomerError ? caught.message : errorMessage(caught))
      setLoading(false)
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!email || !password) {
      setError('Escribe tu email y tu contraseña.')
      return
    }
    void signIn(email, password)
  }

  return (
    <div className="login">
      <section>
        <h1>Haz tus pedidos sin llamar a tu comercial</h1>
        <p className="muted">
          Consulta el catálogo de las marcas que tu empresa tiene licenciadas, prepara el pedido y sigue su
          estado hasta la entrega.
        </p>
      </section>
      <form className="panel" onSubmit={handleSubmit} noValidate>
        <h2>Iniciar sesión</h2>
        {error && (
          <p className="alert" role="alert">
            {error}
          </p>
        )}
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <label htmlFor="password">Contraseña</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
        <div className="demo">
          <p className="muted">
            Distribuidores de demostración (contraseña <strong>demo1234</strong>):
          </p>
          {DEMO_USERS.map((demo) => (
            <button
              key={demo.email}
              type="button"
              className="link"
              onClick={() => void signIn(demo.email, 'demo1234')}
            >
              {demo.label}
            </button>
          ))}
        </div>
      </form>
    </div>
  )
}
