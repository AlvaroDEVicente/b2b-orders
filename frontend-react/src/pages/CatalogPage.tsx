import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { errorMessage } from '../api/client'
import { fetchBrands, fetchProducts } from '../api/endpoints'
import type { Product } from '../api/types'
import { MAX_QUANTITY } from '../cart/cart'
import { useCart } from '../cart/CartContext'
import { Pager } from '../components/Pager'
import { formatMoney } from '../format'
import { useDebouncedValue } from '../hooks/useDebouncedValue'

export function CatalogPage() {
  const [text, setText] = useState('')
  const [brandId, setBrandId] = useState<number | null>(null)
  const [page, setPage] = useState(0)
  const q = useDebouncedValue(text.trim())

  const brands = useQuery({ queryKey: ['brands'], queryFn: fetchBrands, staleTime: 5 * 60_000 })

  const products = useQuery({
    queryKey: ['products', { q, brandId, page }],
    queryFn: () => fetchProducts({ q, brandId, page }),
    placeholderData: keepPreviousData,
  })

  return (
    <>
      <div className="page-head">
        <h1>Catálogo</h1>
        <p className="muted">Solo aparecen las marcas que tu empresa tiene licenciadas hoy.</p>
      </div>

      <div className="filters">
        <div>
          <label htmlFor="q">Buscar por nombre o SKU</label>
          <input
            id="q"
            type="search"
            placeholder="Por ejemplo: Galaxy"
            value={text}
            onChange={(event) => {
              setText(event.target.value)
              setPage(0)
            }}
          />
        </div>
        <div>
          <label htmlFor="brand">Marca</label>
          <select
            id="brand"
            value={brandId ?? ''}
            onChange={(event) => {
              setBrandId(event.target.value ? Number(event.target.value) : null)
              setPage(0)
            }}
          >
            <option value="">Todas</option>
            {brands.data?.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {products.isError && (
        <p className="alert" role="alert">
          {errorMessage(products.error)}
        </p>
      )}
      {products.isPending && <p className="muted">Cargando catálogo…</p>}

      {products.data &&
        (products.data.content.length === 0 ? (
          <div className="panel empty">No hay productos que coincidan con la búsqueda.</div>
        ) : (
          <>
            <ul className="products" aria-busy={products.isFetching}>
              {products.data.content.map((product) => (
                <ProductRow key={product.id} product={product} />
              ))}
            </ul>
            <Pager page={products.data.page} totalPages={products.data.totalPages} onChange={setPage} />
          </>
        ))}
    </>
  )
}

function ProductRow({ product }: { product: Product }) {
  const { lines, dispatch } = useCart()
  const [quantity, setQuantity] = useState(10)
  const inCart = lines.find((line) => line.product.id === product.id)?.quantity ?? 0
  const soldOut = product.stock === 0

  return (
    <li className="product">
      <div>
        <p className="product-name">{product.name}</p>
        <p className="muted small">
          {product.brandName}, SKU {product.sku}
        </p>
      </div>
      <p className="price">{formatMoney(product.unitPrice)}</p>
      <p className={soldOut ? 'stock out' : 'stock'}>{soldOut ? 'Agotado' : `${product.stock} en stock`}</p>
      <div className="add">
        <input
          type="number"
          min={1}
          max={MAX_QUANTITY}
          aria-label={`Cantidad de ${product.name}`}
          value={quantity}
          onChange={(event) => setQuantity(Number(event.target.value))}
        />
        <button
          type="button"
          disabled={quantity < 1}
          onClick={() => dispatch({ type: 'add', product, quantity })}
        >
          Añadir
        </button>
      </div>
      {inCart > 0 && <p className="in-cart">{inCart} en el carrito</p>}
    </li>
  )
}
