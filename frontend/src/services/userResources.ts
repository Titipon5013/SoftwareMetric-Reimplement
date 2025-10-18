import { readToken } from './auth'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787'

async function authFetch(path: string, init: RequestInit = {}) {
  const token = readToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(init.headers as any || {}) }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(API_BASE + path, { ...init, headers })
  if (!res.ok) {
    let message: string | undefined
    const text = await res.text()
    try {
      const j = JSON.parse(text)
      message = j.error || j.message
    } catch {
      message = text
    }
    throw new Error(message || res.statusText)
  }
  if (res.status === 204) return null
  return res.json()
}

// Cart
export async function getCart() {
  return authFetch('/cart')
}
export async function addToCart(payload: { product_id: number; quantity: number; size?: string; color?: string }) {
  return authFetch('/cart', { method: 'POST', body: JSON.stringify(payload) })
}
export async function updateCartItem(id: string, patch: { quantity?: number }) {
  return authFetch(`/cart/${id}`, { method: 'PATCH', body: JSON.stringify(patch) })
}
export async function removeCartItem(id: string) {
  return authFetch(`/cart/${id}`, { method: 'DELETE' })
}

// Favorites
export async function listFavorites() { return authFetch('/favorites') }
export async function addFavorite(product_id: number) { return authFetch('/favorites', { method: 'POST', body: JSON.stringify({ product_id }) }) }
export async function removeFavorite(id: string) { return authFetch(`/favorites/${id}`, { method: 'DELETE' }) }

// Orders
export async function listOrders() { return authFetch('/orders') }
export async function placeOrder(fromCart = true) { return authFetch('/orders', { method: 'POST', body: JSON.stringify({ fromCart }) }) }
export async function listShipments() { return authFetch('/orders/shipments') }
export async function getOrderDetail(id: number) { return authFetch(`/orders/${id}`) }
