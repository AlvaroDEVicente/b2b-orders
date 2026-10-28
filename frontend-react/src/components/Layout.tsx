import { NavLink, Navigate, Outlet } from 'react-router'
import { useAuth } from '../auth/AuthContext'
import { useCart } from '../cart/CartContext'

/** Frame of every page after login. Without a session it sends the user to /login. */
export function Layout() {
  const { user, logout } = useAuth()
  const { units, dispatch } = useCart()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <span className="brand">Portal de distribuidores</span>
          <nav aria-label="Principal">
            <NavLink to="/catalogo">Catálogo</NavLink>
            <NavLink to="/carrito">
              Carrito
              {units > 0 && (
                <span className="count" aria-label={`${units} unidades`}>
                  {units}
                </span>
              )}
            </NavLink>
            <NavLink to="/pedidos">Mis pedidos</NavLink>
          </nav>
          <div className="who">
            <span>{user.fullName}</span>
            <button
              type="button"
              className="link on-dark"
              onClick={() => {
                // The next person on this browser must not inherit the cart.
                dispatch({ type: 'clear' })
                logout()
              }}
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  )
}
