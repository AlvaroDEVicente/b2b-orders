import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useLocation, useParams } from 'react-router'
import { errorMessage } from '../api/client'
import { cancelOrder, confirmOrder, fetchOrder } from '../api/endpoints'
import type { Order, OrderStatus } from '../api/types'
import { StatusBadge } from '../components/StatusBadge'
import { STATUS_LABELS, formatDateTime, formatMoney } from '../format'

const LIFE_CYCLE: OrderStatus[] = ['DRAFT', 'CONFIRMED', 'SHIPPED', 'DELIVERED']

export function OrderPage() {
  const id = Number(useParams().id)
  const location = useLocation()
  const queryClient = useQueryClient()
  const order = useQuery({ queryKey: ['order', id], queryFn: () => fetchOrder(id) })

  const onChanged = (updated: Order) => {
    queryClient.setQueryData(['order', id], updated)
    void queryClient.invalidateQueries({ queryKey: ['orders'] })
    void queryClient.invalidateQueries({ queryKey: ['products'] })
  }
  const confirm = useMutation({ mutationFn: () => confirmOrder(id), onSuccess: onChanged })
  const cancel = useMutation({ mutationFn: () => cancelOrder(id), onSuccess: onChanged })

  const navigationError = (location.state as { error?: string } | null)?.error
  const actionError = confirm.error ?? cancel.error
  const busy = confirm.isPending || cancel.isPending

  return (
    <>
      <p>
        <Link to="/pedidos">Volver a mis pedidos</Link>
      </p>
      {order.isPending && <p className="muted">Cargando pedido…</p>}
      {order.isError && (
        <p className="alert" role="alert">
          {errorMessage(order.error)}
        </p>
      )}
      {navigationError && !actionError && order.data?.status === 'DRAFT' && (
        <p className="alert" role="alert">
          El pedido se ha guardado como borrador, pero no se ha podido confirmar: {navigationError}
        </p>
      )}
      {actionError && (
        <p className="alert" role="alert">
          {errorMessage(actionError)}
        </p>
      )}

      {order.data && (
        <>
          <div className="page-head">
            <h1>Pedido {order.data.id}</h1>
            <StatusBadge status={order.data.status} />
          </div>

          <section className="panel stub">
            {order.data.status === 'CANCELLED' ? (
              <p className="cancelled">Pedido cancelado</p>
            ) : (
              <ol className="track" aria-label="Estado del pedido">
                {LIFE_CYCLE.map((step, index) => {
                  const current = LIFE_CYCLE.indexOf(order.data.status)
                  return (
                    <li
                      key={step}
                      className={[index <= current ? 'done' : '', index === current ? 'current' : ''].join(
                        ' ',
                      )}
                      aria-current={index === current ? 'step' : undefined}
                    >
                      <span className="dot" aria-hidden="true" />
                      <span className="name">{STATUS_LABELS[step]}</span>
                    </li>
                  )
                })}
              </ol>
            )}
            <dl>
              <div>
                <dt>Creado</dt>
                <dd>{formatDateTime(order.data.createdAt)}</dd>
              </div>
              <div>
                <dt>Confirmado</dt>
                <dd>{order.data.confirmedAt ? formatDateTime(order.data.confirmedAt) : 'Pendiente'}</dd>
              </div>
              <div>
                <dt>Creado por</dt>
                <dd>{order.data.createdByName}</dd>
              </div>
            </dl>
          </section>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Marca</th>
                  <th className="num">Cantidad</th>
                  <th className="num">Precio</th>
                  <th className="num">Importe</th>
                </tr>
              </thead>
              <tbody>
                {order.data.lines.map((line) => (
                  <tr key={line.productId}>
                    <td>
                      {line.productName}
                      <span className="muted small block">{line.sku}</span>
                    </td>
                    <td>{line.brandName}</td>
                    <td className="num">{line.quantity}</td>
                    <td className="num">{formatMoney(line.unitPrice)}</td>
                    <td className="num">{formatMoney(line.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4}>Total</td>
                  <td className="num">{formatMoney(order.data.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="actions">
            {order.data.availableActions.includes('CANCEL') && (
              <button
                type="button"
                className="danger"
                disabled={busy}
                onClick={() => window.confirm('¿Cancelar este borrador?') && cancel.mutate()}
              >
                Cancelar borrador
              </button>
            )}
            {order.data.availableActions.includes('CONFIRM') && (
              <button type="button" disabled={busy} onClick={() => confirm.mutate()}>
                {confirm.isPending ? 'Confirmando…' : 'Confirmar pedido'}
              </button>
            )}
          </div>
          {order.data.status === 'CONFIRMED' && (
            <p className="muted">Pedido confirmado. Para cambiarlo o cancelarlo, habla con tu comercial.</p>
          )}
        </>
      )}
    </>
  )
}
