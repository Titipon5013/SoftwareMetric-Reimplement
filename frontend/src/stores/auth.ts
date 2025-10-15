import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'
import { signup as apiSignup, login as apiLogin, getMe, updateProfile, type AuthUser, persistToken, readToken, clearToken, type AuthResponse } from '@/services/auth'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const token = ref<string | null>(readToken())
  const role = ref<'user' | 'admin' | null>(readRole())
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function hydrate() {
    if (!token.value) return
    if (role.value === 'admin') return // admin tokens don't work with /auth/me
    try {
      loading.value = true
      user.value = await getMe(token.value)
    } catch {
      logout()
    } finally {
      loading.value = false
    }
  }

  async function signup(name: string, email: string, password: string) {
    error.value = null
    loading.value = true
    try {
  const res = await apiSignup(name, email, password)
      token.value = res.token
      persistToken(res.token)
      user.value = res.user
  role.value = res.role ?? 'user'
  persistRole(role.value)
    } catch (e: any) {
      error.value = e?.message || 'Signup failed'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function login(identifier: string, password: string) {
    error.value = null
    loading.value = true
    try {
  const res: AuthResponse = await apiLogin(identifier, password)
      token.value = res.token
      persistToken(res.token)
      user.value = res.user
  role.value = res.role ?? 'user'
  persistRole(role.value)
    } catch (e: any) {
      error.value = e?.message || 'Login failed'
      throw e
    } finally {
      loading.value = false
    }
  }

  function logout() {
    clearToken()
    token.value = null
    user.value = null
    role.value = null
    clearRole()
  }

  async function refreshProfile() {
    if (!token.value) return
    user.value = await getMe(token.value)
  }

  async function saveProfile(patch: { name?: string; address?: string; phone?: string }) {
    if (!token.value) throw new Error('Not authenticated')
    const updated = await updateProfile(token.value, patch)
    user.value = updated
  }

  // initial hydration
  hydrate()

  return { user, token, role, loading, error, signup, login, logout, refreshProfile, saveProfile }
})

function persistRole(r: 'user' | 'admin') {
  localStorage.setItem('auth_role', r)
}
function readRole(): 'user' | 'admin' | null {
  const r = localStorage.getItem('auth_role')
  return r === 'user' || r === 'admin' ? r : null
}
function clearRole() {
  localStorage.removeItem('auth_role')
}
