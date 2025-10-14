const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787'

export interface AuthUser {
  id: number
  name: string
  email: string
  address?: string | null
  phone?: string | null
  created_at?: string
}

export interface AuthResponse {
  token: string
  user: AuthUser
}

function authHeaders(token?: string): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function signup(name: string, email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
  })
  if (!res.ok) throw new Error((await res.json()).error || 'Signup failed')
  return res.json()
}

export async function login(identifier: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: identifier.trim(), password }),
  })
  if (!res.ok) throw new Error((await res.json()).error || 'Login failed')
  return res.json()
}

export async function getMe(token: string): Promise<AuthUser> {
  const res = await fetch(`${API_BASE}/auth/me/info`, { headers: authHeaders(token) })
  if (!res.ok) throw new Error('Unauthorized')
  const data = await res.json()
  return data.user
}

export async function updateProfile(token: string, payload: { name?: string; address?: string; phone?: string }): Promise<AuthUser> {
  const res = await fetch(`${API_BASE}/auth/me/profile`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error((await res.json()).error || 'Update failed')
  const data = await res.json()
  return data.user
}

export function persistToken(token: string) {
  localStorage.setItem('auth_token', token)
}

export function readToken(): string | null {
  return localStorage.getItem('auth_token')
}

export function clearToken() {
  localStorage.removeItem('auth_token')
}
