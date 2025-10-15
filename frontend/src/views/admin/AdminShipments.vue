<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { adminListShipments, adminAddShipment, adminUpdateShipment } from '@/services/admin'

const auth = useAuthStore()
const loading = ref(false)
const error = ref<string | null>(null)
const shipments = ref<any[]>([])

const form = ref({ order_id: '', tracking_number: '', status: '' })

async function load() {
  loading.value = true
  try {
    const res = await adminListShipments({}, auth.token || undefined)
    shipments.value = res.items || []
    error.value = null
  } catch (e: any) {
    error.value = e?.message || 'Failed to load shipments'
  } finally {
    loading.value = false
  }
}

async function addShipment() {
  await adminAddShipment({ order_id: Number(form.value.order_id), tracking_number: form.value.tracking_number, status: form.value.status }, auth.token || undefined)
  form.value = { order_id: '', tracking_number: '', status: '' }
  await load()
}

async function updateStatus(id: number, status: string) {
  await adminUpdateShipment(id, { status }, auth.token || undefined)
  await load()
}

onMounted(load)
</script>

<template>
  <section>
    <header class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl font-semibold">Shipping and Tracking Management</h1>
      <RouterLink to="/admin" class="text-sm text-slate-600 underline">Back to Dashboard</RouterLink>
    </header>

    <form @submit.prevent="addShipment" class="mb-4 flex flex-wrap gap-2">
      <input v-model="form.order_id" type="text" placeholder="Order ID" required class="border rounded px-3 py-2" />
      <input v-model="form.tracking_number" type="text" placeholder="Tracking Number" required class="border rounded px-3 py-2" />
      <input v-model="form.status" type="text" placeholder="Status" required class="border rounded px-3 py-2" />
      <button type="submit" class="rounded bg-black text-white px-4 py-2">Add Shipment</button>
    </form>

    <table class="w-full border text-sm">
      <thead class="bg-slate-50">
        <tr>
          <th class="p-2 border">Order ID</th>
          <th class="p-2 border">Tracking Number</th>
          <th class="p-2 border">Status</th>
          <th class="p-2 border">Update Status</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="s in shipments" :key="s.id">
          <td class="p-2 border">{{ s.order_id }}</td>
          <td class="p-2 border">{{ s.tracking_number }}</td>
          <td class="p-2 border">{{ s.status }}</td>
          <td class="p-2 border">
            <select class="border rounded px-2 py-1" :value="s.status" @change="updateStatus(s.id, ($event.target as HTMLSelectElement).value)">
              <option value="pending">Pending</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
            </select>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>
