import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'
import { signup as apiSignup, login as apiLogin, getMe, updateProfile, type AuthUser, persistToken, readToken, clearToken } from '@/services/auth'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const token = ref<string | null>(readToken())
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function hydrate() {
    if (!token.value) return
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
      const res = await apiLogin(identifier, password)
      token.value = res.token
      persistToken(res.token)
      user.value = res.user
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

  return { user, token, loading, error, signup, login, logout, refreshProfile, saveProfile }
})
