interface PagerProps {
  page: number
  totalPages: number
  onChange: (page: number) => void
}

export function Pager({ page, totalPages, onChange }: PagerProps) {
  if (totalPages <= 1) return null
  return (
    <div className="pager">
      <button type="button" className="secondary" disabled={page === 0} onClick={() => onChange(page - 1)}>
        Anterior
      </button>
      <span>
        Página {page + 1} de {totalPages}
      </span>
      <button
        type="button"
        className="secondary"
        disabled={page + 1 >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        Siguiente
      </button>
    </div>
  )
}
