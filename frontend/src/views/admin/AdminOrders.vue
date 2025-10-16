<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { adminListOrders, adminUpdateOrderStatus } from '@/services/admin'

const auth = useAuthStore()
const loading = ref(false)
const error = ref<string | null>(null)
const orders = ref<any[]>([])

async function load() {
  loading.value = true
  try {
    const res = await adminListOrders(auth.token || undefined)
    orders.value = res.items || []
    error.value = null
  } catch (e: any) {
    error.value = e?.message || 'Failed to load orders'
  } finally {
    loading.value = false
  }
}

async function updateStatus(id: number, status: string) {
  try {
    await adminUpdateOrderStatus(id, status, auth.token || undefined)
    await load()
  } catch (e: any) {
    error.value = e?.message || 'Failed to update status'
  }
}

onMounted(load)
</script>

<template>
  <section>
    <header class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl font-semibold">Order Management</h1>
      <RouterLink
        to="/admin"
        class="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition"
        aria-label="Back to Dashboard"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-4 w-4">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        <span>Back to Dashboard</span>
      </RouterLink>
    </header>
    <div v-if="loading">Loading...</div>
    <div v-else>
      <table class="w-full border text-sm">
        <thead class="bg-slate-50">
          <tr>
            <th class="p-2 border">ID</th>
            <th class="p-2 border">User</th>
            <th class="p-2 border">Full Name</th>
            <th class="p-2 border">Address</th>
            <th class="p-2 border">Payment</th>
            <th class="p-2 border">Status</th>
            <th class="p-2 border">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="o in orders" :key="o.id">
            <td class="p-2 border">{{ o.id }}</td>
            <td class="p-2 border">{{ o.user_id }}</td>
            <td class="p-2 border">{{ o.fullname }}</td>
            <td class="p-2 border">{{ o.shipping_address }}</td>
            <td class="p-2 border">{{ o.payment_method }}</td>
            <td class="p-2 border">
              <select class="border rounded px-2 py-1" :value="o.status" @change="updateStatus(o.id, ($event.target as HTMLSelectElement).value)">
                <option value="pending">Pending</option>
                <option value="shipping">Shipping</option>
                <option value="success">Success</option>
              </select>
            </td>
            <td class="p-2 border">${{ Number(o.total_price).toFixed(2) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
