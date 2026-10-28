import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router'
import { errorMessage } from '../api/client'
import { confirmOrder, createOrder } from '../api/endpoints'
import { MAX_QUANTITY, cartTotal } from '../cart/cart'
import { useCart } from '../cart/CartContext'
import { formatMoney } from '../format'

export function CartPage() {
  const { lines, total, dispatch } = useCart()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  /**
   * One mutation, two API calls: create the draft and, if asked, confirm it straight away.
   * If the confirmation fails (no stock, say) the draft still exists and the user lands on it.
   */
  const placeOrder = useMutation({
    mutationFn: async (confirm: boolean) => {
      const draft = await createOrder(
        lines.map((line) => ({ productId: line.product.id, quantity: line.quantity })),
      )
      if (!confirm) return draft
      try {
        return await confirmOrder(draft.id)
      } catch (error) {
        throw Object.assign(error as Error, { draftId: draft.id })
      }
    },
    onSuccess: (order) => {
      dispatch({ type: 'clear' })
      // The orders list is now out of date: mark it so React Query fetches it again.
      void queryClient.invalidateQueries({ queryKey: ['orders'] })
      void queryClient.invalidateQueries({ queryKey: ['products'] })
      navigate(`/pedidos/${order.id}`)
    },
    onError: (error) => {
      const draftId = (error as { draftId?: number }).draftId
      if (draftId) {
        dispatch({ type: 'clear' })
        void queryClient.invalidateQueries({ queryKey: ['orders'] })
        navigate(`/pedidos/${draftId}`, { state: { error: errorMessage(error) } })
      }
    },
  })

  if (lines.length === 0) {
    return (
      <>
        <h1>Carrito</h1>
        <div className="panel empty">
          <p>Tu carrito está vacío.</p>
          <Link className="button" to="/catalogo">
            Ir al catálogo
          </Link>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="page-head">
        <h1>Carrito</h1>
      </div>

      {placeOrder.isError && !(placeOrder.error as { draftId?: number }).draftId && (
        <p className="alert" role="alert">
          {errorMessage(placeOrder.error)}
        </p>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th className="num">Precio</th>
              <th className="qty">Cantidad</th>
              <th className="num">Importe</th>
              <th>
                <span className="visually-hidden">Quitar</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr key={line.product.id}>
                <td>
                  {line.product.name}
                  <span className="muted small block">{line.product.sku}</span>
                </td>
                <td className="num">{formatMoney(line.product.unitPrice)}</td>
                <td className="qty">
                  <input
                    type="number"
                    min={1}
                    max={MAX_QUANTITY}
                    aria-label={`Cantidad de ${line.product.name}`}
                    value={line.quantity}
                    onChange={(event) =>
                      dispatch({
                        type: 'setQuantity',
                        productId: line.product.id,
                        quantity: Number(event.target.value),
                      })
                    }
                  />
                </td>
                <td className="num">{formatMoney(cartTotal([line]))}</td>
                <td>
                  <button
                    type="button"
                    className="link"
                    onClick={() => dispatch({ type: 'remove', productId: line.product.id })}
                  >
                    Quitar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3}>Total</td>
              <td className="num">{formatMoney(total)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="actions">
        <button
          type="button"
          className="secondary"
          disabled={placeOrder.isPending}
          onClick={() => placeOrder.mutate(false)}
        >
          Guardar como borrador
        </button>
        <button type="button" disabled={placeOrder.isPending} onClick={() => placeOrder.mutate(true)}>
          {placeOrder.isPending ? 'Enviando…' : 'Confirmar pedido'}
        </button>
      </div>
      <p className="muted small">
        Al confirmar se reserva el stock y el pedido pasa a tu comercial. Un borrador lo puedes confirmar más
        tarde.
      </p>
    </>
  )
}
