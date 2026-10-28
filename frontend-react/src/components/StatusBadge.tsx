import type { OrderStatus } from '../api/types'
import { STATUS_LABELS } from '../format'

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className="badge" data-status={status}>
      {STATUS_LABELS[status]}
    </span>
  )
}
