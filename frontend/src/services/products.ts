export type RawProduct = {
  id: number
  name: string
  price: number
  promotion_price?: number | null
  size?: string[] | string | null
  colors?: string[] | string | null
  image?: string | null
  description?: string | null
  // Optional fields if backend later adds them
  brand?: string | null
  category?: string | null
}

export type Product = {
  id: number
  name: string
  price: number
  promotion_price?: number
  sizes: string[]
  colors: string[]
  image: string
  description?: string
  brand?: string
  category?: string
}

function parseMaybeArray(value: string[] | string | null | undefined): string[] {
  if (!value) return []
  if (Array.isArray(value)) return value
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function normalizeProduct(p: RawProduct): Product {
  return {
    id: p.id,
    name: p.name,
    price: p.price,
    promotion_price: p.promotion_price ?? undefined,
    sizes: parseMaybeArray(p.size),
    colors: parseMaybeArray(p.colors),
    image: p.image ?? '',
    description: p.description ?? undefined,
    brand: p.brand ?? undefined,
    category: p.category ?? undefined,
  }
}

// Default to local backend if env not provided (helps avoid calling the frontend origin by mistake)
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8799'

export async function fetchProducts(params: { limit?: number; offset?: number } = {}): Promise<{ items: Product[]; total?: number; limit?: number; offset?: number }> {
  const q = new URLSearchParams()
  if (params.limit) q.set('limit', String(params.limit))
  if (params.offset) q.set('offset', String(params.offset))
  const url = q.toString() ? `${API_BASE}/products?${q.toString()}` : `${API_BASE}/products`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch products: ${res.status}`)
  const raw = await res.json()
  // Support both array and {items,total}
  const list: RawProduct[] = Array.isArray(raw) ? raw : (raw?.items ?? [])
  const items = list.map(normalizeProduct)
  return {
    items,
    total: raw?.total,
    limit: raw?.limit,
    offset: raw?.offset,
  }
}

export async function fetchProductById(id: number): Promise<Product | null> {
  const res = await fetch(`${API_BASE}/products/${id}`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Failed to fetch product: ${res.status}`)
  const data: RawProduct = await res.json()
  return normalizeProduct(data)
}
