<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
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
            <RouterLink to="/profile" class="hover:text-emerald-600">Profile</RouterLink>
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
