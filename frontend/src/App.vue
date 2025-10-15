<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { RouterLink, RouterView, useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { useFavoritesStore } from '@/stores/favorites'
import Toaster from '@/components/Toaster.vue'

const auth = useAuthStore()
const cart = useCartStore()
const router = useRouter()
const favorites = useFavoritesStore()
const route = useRoute()

const isAdminRoute = computed(() => route.path.startsWith('/admin'))

function handleLogout() {
  auth.logout()
  router.push('/login')
}

onMounted(() => {
  if (auth.token && auth.role !== 'admin') { cart.refresh(); favorites.refresh() }
})
watch(() => [auth.token, auth.role], ([t, r]) => {
  if (t && r !== 'admin') { cart.refresh(); favorites.refresh() } else { cart.$reset(); favorites.$reset() }
})
</script>

<template>
  <div class="min-h-screen w-full bg-white text-slate-800">
  <!-- Navbar -->
  <header v-if="!isAdminRoute" class="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/90 backdrop-blur">
      <div class="w-full px-4 sm:px-6 lg:px-8">
        <div class="flex h-16 items-center justify-between">
          <!-- Brand -->
          <RouterLink to="/" class="flex items-center gap-2 font-semibold">
            <img src="/favicon.ico" alt="logo" class="h-8 w-8" />
            <span class="hidden sm:inline">CJ Streetwear</span>
          </RouterLink>

          <!-- Nav links -->
          <nav class="flex items-center gap-6 text-sm">
            <RouterLink to="/" class="hover:text-emerald-600 transition-colors" exact-active-class="text-emerald-600 font-semibold">Home</RouterLink>
            <RouterLink to="/products" class="hover:text-emerald-600 transition-colors" active-class="text-emerald-600 font-semibold">Products</RouterLink>
            <RouterLink to="/about" class="hover:text-emerald-600 transition-colors" exact-active-class="text-emerald-600 font-semibold">About</RouterLink>
            <RouterLink v-if="auth.token" to="/profile" class="hover:text-emerald-600 transition-colors flex items-center gap-1" exact-active-class="text-emerald-600 font-semibold">
              <span>Profile</span>
              <span v-if="auth.user" class="inline-block rounded bg-emerald-100 text-emerald-700 px-2 py-0.5 text-xs font-medium">{{ auth.user.name }}</span>
            </RouterLink>
            <RouterLink v-if="!auth.token" to="/login" class="hover:text-emerald-600 transition-colors" exact-active-class="text-emerald-600 font-semibold">Login</RouterLink>
            <button v-if="auth.token" @click="handleLogout" class="text-slate-600 hover:text-red-600">Logout</button>
            <!-- Favorites icon next to cart -->
            <RouterLink to="/favorites" class="relative inline-flex items-center hover:text-emerald-600 transition-colors" exact-active-class="text-emerald-600 font-semibold" aria-label="Favorites">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-5 w-5">
                <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.514 2.25 9a4.5 4.5 0 018.727-1.364.75.75 0 001.346 0A4.5 4.5 0 0116.5 4.5c2.485 0 4.5 2.019 4.5 4.5 0 3.514-2.438 6.36-4.739 8.507a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.682 0l-.003-.001z" />
              </svg>
              <span v-if="favorites.count > 0" class="absolute -top-2 -right-3 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-600 px-1.5 text-xs font-semibold text-white">{{ favorites.count }}</span>
            </RouterLink>
            <!-- Cart moved to far right -->
            <RouterLink to="/cart" class="relative inline-flex items-center hover:text-emerald-600 transition-colors" exact-active-class="text-emerald-600 font-semibold" aria-label="Cart">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-5 w-5">
                <path d="M2.25 3a.75.75 0 0 0 0 1.5h1.386c.162 0 .304.11.342.268l2.343 9.372a2.25 2.25 0 0 0 2.186 1.71h7.443a2.25 2.25 0 0 0 2.186-1.71l1.557-6.229A.75.75 0 0 0 19.5 6H6.723l-.4-1.598A1.875 1.875 0 0 0 3.636 3H2.25Z"/>
                <path d="M8.25 20.25a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm9 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"/>
              </svg>
              <span v-if="cart.count > 0" class="absolute -top-2 -right-3 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-600 px-1.5 text-xs font-semibold text-white">{{ cart.count }}</span>
            </RouterLink>
          </nav>
        </div>
      </div>
    </header>

    <!-- Page content -->
    <main class="w-full px-4 py-8 sm:px-6 lg:px-8">
      <RouterView />
    </main>
    <!-- Global toaster -->
    <Toaster />
  </div>
  
</template>

<style scoped></style>
