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
      <RouterLink to="/admin" class="text-sm text-slate-600 underline">Back to Dashboard</RouterLink>
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
