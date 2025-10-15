<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const loading = ref(false)
const error = ref<string | null>(null)

function logout() {
  auth.logout()
  window.location.href = '/login'
}

onMounted(async () => {
  // Placeholder for dashboard stats in future
})
</script>

<template>
  <section class="max-w-6xl mx-auto">
    <header class="mb-8 flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p class="mt-1 text-sm text-slate-600">Manage orders, products, categories, inventory and shipments</p>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-sm text-slate-700">Welcome, <strong>{{ auth.user?.name || 'Admin' }}</strong></span>
        <button @click="logout" class="rounded-lg bg-black text-white px-4 py-2 text-sm hover:bg-slate-800">Logout</button>
      </div>
    </header>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <RouterLink class="group rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow transition bg-white" :to="{ name: 'admin-orders' }">
        <div class="text-lg font-semibold">Orders</div>
        <p class="mt-1 text-sm text-slate-600">View and update order statuses</p>
      </RouterLink>
      <RouterLink class="group rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow transition bg-white" :to="{ name: 'admin-products' }">
        <div class="text-lg font-semibold">Products</div>
        <p class="mt-1 text-sm text-slate-600">Manage products list</p>
      </RouterLink>
      <RouterLink class="group rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow transition bg-white" :to="{ name: 'admin-categories' }">
        <div class="text-lg font-semibold">Categories</div>
        <p class="mt-1 text-sm text-slate-600">Create, edit, and delete categories</p>
      </RouterLink>
      <RouterLink class="group rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow transition bg-white" :to="{ name: 'admin-inventory' }">
        <div class="text-lg font-semibold">Inventory</div>
        <p class="mt-1 text-sm text-slate-600">Track stock for color & size variants</p>
      </RouterLink>
      <RouterLink class="group rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow transition bg-white" :to="{ name: 'admin-shipments' }">
        <div class="text-lg font-semibold">Shipments</div>
        <p class="mt-1 text-sm text-slate-600">Add tracking and update shipment status</p>
      </RouterLink>
      <RouterLink class="group rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow transition bg-white" :to="{ name: 'admin-customers' }">
        <div class="text-lg font-semibold">Customers</div>
        <p class="mt-1 text-sm text-slate-600">Manage customer accounts</p>
      </RouterLink>
    </div>
  </section>
</template>
