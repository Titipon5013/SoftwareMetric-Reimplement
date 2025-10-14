import { readToken } from './auth'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787'

async function authFetch(path: string, init: RequestInit = {}) {
  const token = readToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(init.headers as any || {}) }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(API_BASE + path, { ...init, headers })
  if (!res.ok) {
    let message: string | undefined
    try {
      const j = await res.json()
      message = j?.error || j?.message
    } catch {
      message = res.statusText
    }
    throw new Error(message || 'Request failed')
  }
  if (res.status === 204) return null
  return res.json()
}

export type Address = {
  id: number
  label?: string | null
  recipient?: string | null
  line1?: string | null
  line2?: string | null
  city?: string | null
  state?: string | null
  postal_code?: string | null
  country?: string | null
  phone?: string | null
  is_default?: boolean
}

export async function listAddresses(): Promise<{ items: Address[] }> { return authFetch('/addresses') }
export async function createAddress(a: Partial<Address> & { is_default?: boolean }) { return authFetch('/addresses', { method: 'POST', body: JSON.stringify(a) }) }
export async function updateAddress(id: number, a: Partial<Address>) { return authFetch(`/addresses/${id}`, { method: 'PATCH', body: JSON.stringify(a) }) }
export async function deleteAddress(id: number) { return authFetch(`/addresses/${id}`, { method: 'DELETE' }) }
export async function setDefaultAddress(id: number) { return authFetch(`/addresses/${id}/default`, { method: 'POST' }) }
