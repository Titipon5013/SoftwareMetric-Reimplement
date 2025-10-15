<template>
  <div class="min-h-[80vh] flex items-center justify-center py-8 bg-white">
    <div class="w-full max-w-md">
      <h1 class="text-2xl font-semibold mb-6 text-center tracking-tight">Admin Login</h1>
      <form @submit.prevent="onSubmit" class="space-y-5 bg-white p-8 rounded-2xl shadow border border-neutral-200">
        <div class="space-y-2">
          <label for="identifier" class="block text-sm font-medium">Username</label>
          <input id="identifier" v-model="identifier" type="text" required autocomplete="username"
                 class="w-full px-3 py-2 rounded-md border border-neutral-300 bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition" />
        </div>
        <div class="space-y-2">
          <label for="password" class="block text-sm font-medium">Password</label>
          <input id="password" v-model="password" type="password" required autocomplete="current-password"
                 class="w-full px-3 py-2 rounded-md border border-neutral-300 bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition" />
        </div>
        <div v-if="auth.error" class="text-sm text-red-600">{{ auth.error }}</div>
        <button type="submit" :disabled="auth.loading" class="w-full inline-flex justify-center items-center gap-2 px-4 py-2 rounded-lg font-medium bg-black text-white shadow hover:bg-zinc-800 disabled:opacity-60 disabled:cursor-not-allowed transition">
          <span v-if="!auth.loading">Login</span>
          <span v-else class="animate-pulse">Signing in...</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const identifier = ref('')
const password = ref('')

async function onSubmit() {
  try {
    await auth.login(identifier.value.trim(), password.value)
    if (auth.role === 'admin') {
      const redirect = (route.query.redirect as string) || '/admin'
      router.replace(redirect)
      return
    }
    router.replace('/')
  } catch {
    // error handled in store
  }
}
</script>
