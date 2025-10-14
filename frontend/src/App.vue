<script setup lang="ts">
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen w-full bg-white text-slate-800">
    <!-- Navbar -->
    <header class="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/90 backdrop-blur">
      <div class="w-full px-4 sm:px-6 lg:px-8">
        <div class="flex h-16 items-center justify-between">
          <!-- Brand -->
          <RouterLink to="/" class="flex items-center gap-2 font-semibold">
            <img src="/favicon.ico" alt="logo" class="h-8 w-8" />
            <span class="hidden sm:inline">CJ Streetwear</span>
          </RouterLink>

          <!-- Nav links -->
          <nav class="flex items-center gap-6 text-sm">
            <RouterLink to="/" class="hover:text-emerald-600">Home</RouterLink>
            <RouterLink to="/products" class="hover:text-emerald-600">Products</RouterLink>
            <RouterLink to="/about" class="hover:text-emerald-600">About</RouterLink>
            <RouterLink v-if="auth.token" to="/profile" class="hover:text-emerald-600 flex items-center gap-1">
              <span>Profile</span>
              <span v-if="auth.user" class="inline-block rounded bg-emerald-100 text-emerald-700 px-2 py-0.5 text-xs font-medium">{{ auth.user.name }}</span>
            </RouterLink>
            <RouterLink v-if="!auth.token" to="/login" class="hover:text-emerald-600">Login</RouterLink>
            <button v-if="auth.token" @click="handleLogout" class="text-slate-600 hover:text-red-600">Logout</button>
            <RouterLink to="/admin" class="rounded bg-slate-900 px-3 py-1.5 text-white hover:bg-slate-700">Admin</RouterLink>
          </nav>
        </div>
      </div>
    </header>

    <!-- Page content -->
    <main class="w-full px-4 py-8 sm:px-6 lg:px-8">
      <RouterView />
    </main>
  </div>
  
</template>

<style scoped></style>
