<template>
  <div class="min-h-[80vh] flex items-center justify-center py-8 bg-white">
    <div class="w-full max-w-md">
      <h1 class="text-2xl font-semibold mb-6 text-center tracking-tight">Create Account</h1>
  <form @submit.prevent="onSubmit" class="space-y-5 bg-white p-8 rounded-2xl shadow border border-neutral-200">
      <div class="space-y-2">
        <label for="name" class="block text-sm font-medium">Name</label>
        <input id="name" v-model="name" type="text" required autocomplete="name"
               class="w-full px-3 py-2 rounded-md border border-neutral-300 bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition" />
      </div>
      <div class="space-y-2">
        <label for="email" class="block text-sm font-medium">Email</label>
        <input id="email" v-model="email" type="email" required autocomplete="email"
               class="w-full px-3 py-2 rounded-md border border-neutral-300 bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition" />
      </div>
      <div class="space-y-2">
        <label for="password" class="block text-sm font-medium">Password</label>
        <input id="password" v-model="password" type="password" required minlength="6" autocomplete="new-password"
               class="w-full px-3 py-2 rounded-md border border-neutral-300 bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition" />
      </div>
      <div v-if="auth.error" class="text-sm text-red-600">{{ auth.error }}</div>
  <button type="submit" :disabled="auth.loading" class="w-full inline-flex justify-center items-center gap-2 px-4 py-2 rounded-lg font-medium bg-black text-white shadow hover:bg-zinc-800 disabled:opacity-60 disabled:cursor-not-allowed transition">
        <span v-if="!auth.loading">Create Account</span>
        <span v-else class="animate-pulse">Creating...</span>
      </button>
      <p class="text-sm text-center text-neutral-600">Already have an account?
        <RouterLink to="/login" class="text-black font-medium hover:underline">Login</RouterLink>
      </p>
    </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const name = ref('')
const email = ref('')
const password = ref('')

async function onSubmit() {
  try {
    await auth.signup(name.value.trim(), email.value.trim(), password.value)
    router.replace('/')
  } catch {
    // handled in store
  }
}
</script>
