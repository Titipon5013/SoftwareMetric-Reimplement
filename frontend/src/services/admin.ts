const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787'

function authHeaders(token?: string): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
}

async function adminFetch(path: string, init: RequestInit = {}, token?: string) {
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers: { ...authHeaders(token), ...(init.headers as any) } })
  if (!res.ok) {
    let msg = 'Request failed'
    try { const j = await res.json(); msg = j.error || msg } catch {}
    throw new Error(msg)
  }
  if (res.status === 204) return null
  return res.json()
}

// Categories
export const adminListCategories = (token?: string) => adminFetch('/admin/categories', {}, token)
export const adminAddCategory = (category_name: string, token?: string) => adminFetch('/admin/categories', { method: 'POST', body: JSON.stringify({ category_name }) }, token)
export const adminEditCategory = (id: number, category_name: string, token?: string) => adminFetch(`/admin/categories/${id}`, { method: 'PATCH', body: JSON.stringify({ category_name }) }, token)
export const adminDeleteCategory = (id: number, token?: string) => adminFetch(`/admin/categories/${id}`, { method: 'DELETE' }, token)

// Orders
export const adminListOrders = (token?: string) => adminFetch('/admin/orders', {}, token)
export const adminUpdateOrderStatus = (id: number, status: string, token?: string) => adminFetch('/admin/orders/update-status', { method: 'POST', body: JSON.stringify({ id, status }) }, token)

// Shipments
export const adminListShipments = (params: { order_id?: number; status?: string } = {}, token?: string) => {
  const qs = new URLSearchParams()
  if (params.order_id) qs.set('order_id', String(params.order_id))
  if (params.status) qs.set('status', params.status)
  const q = qs.toString()
  return adminFetch(`/admin/shipments${q ? `?${q}` : ''}`, {}, token)
}
export const adminAddShipment = (payload: { order_id: number; tracking_number: string; status: string }, token?: string) => adminFetch('/admin/shipments', { method: 'POST', body: JSON.stringify(payload) }, token)
export const adminUpdateShipment = (id: number, patch: { status?: string; tracking_number?: string }, token?: string) => adminFetch(`/admin/shipments/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }, token)

// Inventory
export const adminListInventory = (params: { product_id?: number } = {}, token?: string) => {
  const qs = new URLSearchParams()
  if (params.product_id) qs.set('product_id', String(params.product_id))
  const q = qs.toString()
  return adminFetch(`/admin/inventory${q ? `?${q}` : ''}`, {}, token)
}
export const adminAddInventory = (payload: { product_id: number; color: string; size: string; stock: number }, token?: string) => adminFetch('/admin/inventory', { method: 'POST', body: JSON.stringify(payload) }, token)
export const adminPatchInventory = (id: number, payload: { color?: string; size?: string; stock?: number }, token?: string) => adminFetch(`/admin/inventory/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }, token)
export const adminDeleteInventory = (id: number, token?: string) => adminFetch(`/admin/inventory/${id}`, { method: 'DELETE' }, token)

// Products
export const adminListProducts = (params: { limit?: number; offset?: number; search?: string } = {}, token?: string) => {
  const qs = new URLSearchParams()
  if (params.limit) qs.set('limit', String(params.limit))
  if (params.offset) qs.set('offset', String(params.offset))
  if (params.search) qs.set('search', params.search)
  const q = qs.toString()
  return adminFetch(`/admin/products${q ? `?${q}` : ''}`, {}, token)
}
export const adminGetProduct = (id: number, token?: string) => adminFetch(`/admin/products/${id}`, {}, token)
export const adminCreateProduct = (payload: { name: string; price: number; promotion_price?: number | null; image?: string | null; description?: string | null; size?: string[]; colors?: string[]; category_ids: number[] }, token?: string) => adminFetch('/admin/products', { method: 'POST', body: JSON.stringify(payload) }, token)
export const adminUpdateProduct = (id: number, payload: { name?: string; price?: number; promotion_price?: number | null; image?: string | null; description?: string | null; size?: string[]; colors?: string[]; category_ids?: number[] }, token?: string) => adminFetch(`/admin/products/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }, token)
export const adminDeleteProduct = (id: number, token?: string) => adminFetch(`/admin/products/${id}`, { method: 'DELETE' }, token)

// Customers
export const adminListCustomers = (params: { limit?: number; offset?: number; search?: string } = {}, token?: string) => {
  const qs = new URLSearchParams()
  if (params.limit) qs.set('limit', String(params.limit))
  if (params.offset) qs.set('offset', String(params.offset))
  if (params.search) qs.set('search', params.search)
  const q = qs.toString()
  return adminFetch(`/admin/customers${q ? `?${q}` : ''}`, {}, token)
}
export const adminAddCustomer = (payload: { name: string; email: string; password: string; address: string; phone: string }, token?: string) => adminFetch('/admin/customers', { method: 'POST', body: JSON.stringify(payload) }, token)
export const adminEditCustomer = (id: number, patch: { name?: string; email?: string; password?: string; address?: string; phone?: string }, token?: string) => adminFetch(`/admin/customers/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }, token)
export const adminDeleteCustomer = (id: number, token?: string) => adminFetch(`/admin/customers/${id}`, { method: 'DELETE' }, token)
