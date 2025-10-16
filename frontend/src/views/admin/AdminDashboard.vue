<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { adminGetMetrics } from '@/services/admin'

const auth = useAuthStore()
const loading = ref(false)
const error = ref<string | null>(null)
const metrics = ref<{ total_orders: number; best_sellers: any[]; top_spenders: any[] } | null>(null)

function logout() {
  auth.logout()
  window.location.href = '/login'
}

onMounted(async () => {
  try {
    loading.value = true
    const res = await adminGetMetrics(auth.token || undefined)
    metrics.value = res
    error.value = null
  } catch (e: any) {
    error.value = e?.message || 'Failed to load metrics'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <section class="max-w-6xl mx-auto px-4">
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

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div class="rounded-2xl border border-slate-200 p-6 bg-white">
        <div class="text-sm text-slate-500">Total Orders</div>
        <div class="mt-2 text-3xl font-bold">{{ metrics?.total_orders ?? '—' }}</div>
      </div>
      <div class="rounded-2xl border border-slate-200 p-6 bg-white">
        <div class="text-sm text-slate-500">Best Sellers</div>
        <ul class="mt-2 space-y-2 max-h-40 overflow-auto">
          <li v-for="p in metrics?.best_sellers || []" :key="p.product?.id" class="flex items-center gap-3">
            <img v-if="p.product?.image" :src="p.product.image" class="h-8 w-8 object-cover rounded" />
            <div class="flex-1">
              <div class="text-sm font-medium truncate">{{ p.product?.name || ('#' + p.product?.id) }}</div>
              <div class="text-xs text-slate-500">Qty {{ p.total_qty }} · ${{ p.total_revenue }}</div>
            </div>
          </li>
          <li v-if="(metrics?.best_sellers?.length || 0) === 0" class="text-sm text-slate-500">No data</li>
        </ul>
      </div>
      <div class="rounded-2xl border border-slate-200 p-6 bg-white">
        <div class="text-sm text-slate-500">Top Spenders</div>
        <ul class="mt-2 space-y-2 max-h-40 overflow-auto">
          <li v-for="u in metrics?.top_spenders || []" :key="u.user?.id" class="flex items-center gap-3">
            <div class="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs">
              {{ (u.user?.name || 'U').slice(0,1).toUpperCase() }}
            </div>
            <div class="flex-1">
              <div class="text-sm font-medium truncate">{{ u.user?.name || ('User #' + u.user?.id) }}</div>
              <div class="text-xs text-slate-500">${{ u.total_spent }} · {{ u.orders_count }} orders</div>
            </div>
          </li>
          <li v-if="(metrics?.top_spenders?.length || 0) === 0" class="text-sm text-slate-500">No data</li>
        </ul>
      </div>
    </div>

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
