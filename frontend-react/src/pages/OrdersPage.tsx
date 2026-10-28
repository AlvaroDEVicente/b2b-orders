import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { errorMessage } from '../api/client'
import { fetchOrders } from '../api/endpoints'
import type { OrderStatus } from '../api/types'
import { Pager } from '../components/Pager'
import { StatusBadge } from '../components/StatusBadge'
import { STATUS_LABELS, formatDateTime, formatMoney } from '../format'

const STATUSES = Object.keys(STATUS_LABELS) as OrderStatus[]

export function OrdersPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<OrderStatus | null>(null)
  const [page, setPage] = useState(0)

  const orders = useQuery({
    queryKey: ['orders', { status, page }],
    queryFn: () => fetchOrders({ status, page }),
    placeholderData: keepPreviousData,
  })

  function choose(next: OrderStatus | null) {
    setStatus(next)
    setPage(0)
  }

  return (
    <>
      <div className="page-head">
        <h1>Mis pedidos</h1>
        <Link className="button" to="/catalogo">
          Hacer un pedido
        </Link>
      </div>

      <div className="chips" role="group" aria-label="Filtrar por estado">
        <button type="button" aria-pressed={status === null} onClick={() => choose(null)}>
          Todos
        </button>
        {STATUSES.map((value) => (
          <button key={value} type="button" aria-pressed={status === value} onClick={() => choose(value)}>
            {STATUS_LABELS[value]}
          </button>
        ))}
      </div>

      {orders.isError && (
        <p className="alert" role="alert">
          {errorMessage(orders.error)}
        </p>
      )}
      {orders.isPending && <p className="muted">Cargando pedidos…</p>}

      {orders.data &&
        (orders.data.content.length === 0 ? (
          <div className="panel empty">No tienes pedidos{status ? ' en este estado' : ''}.</div>
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Nº</th>
                    <th>Estado</th>
                    <th>Creado</th>
                    <th className="num">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.data.content.map((order) => (
                    <tr key={order.id} className="clickable" onClick={() => navigate(`/pedidos/${order.id}`)}>
                      <td>
                        <Link to={`/pedidos/${order.id}`} onClick={(event) => event.stopPropagation()}>
                          {order.id}
                        </Link>
                      </td>
                      <td>
                        <StatusBadge status={order.status} />
                      </td>
                      <td>{formatDateTime(order.createdAt)}</td>
                      <td className="num">{formatMoney(order.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager page={orders.data.page} totalPages={orders.data.totalPages} onChange={setPage} />
          </>
        ))}
    </>
  )
}
