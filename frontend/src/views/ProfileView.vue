<template>
  <div class="min-h-[80vh] flex items-start md:items-center justify-center py-10 bg-white">
    <div class="w-full max-w-2xl">
      <h1 class="text-2xl font-semibold mb-8 tracking-tight">Profile</h1>
  <div v-if="!auth.token" class="p-6 bg-amber-50 border border-amber-200 rounded-xl text-amber-800">Please <RouterLink to="/login" class="underline">login</RouterLink> to view your profile.</div>
      <div v-else class="space-y-8">
  <form @submit.prevent="onSave" class="bg-white p-8 rounded-2xl shadow border border-neutral-200 space-y-6">
        <div class="grid sm:grid-cols-2 gap-5">
          <div class="space-y-2">
            <label for="name" class="block text-sm font-medium">Name</label>
            <input id="name" v-model="form.name" type="text" class="w-full px-3 py-2 rounded-md border border-neutral-300 bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition" />
          </div>
          <div class="space-y-2">
            <label class="block text-sm font-medium">Email</label>
            <input :value="auth.user?.email" disabled class="w-full px-3 py-2 rounded-md border border-neutral-200 bg-neutral-50 text-neutral-500" />
          </div>
        </div>
        <div class="space-y-2">
          <label for="address" class="block text-sm font-medium">Address</label>
            <textarea id="address" v-model="form.address" rows="3" class="w-full px-3 py-2 rounded-md border border-neutral-300 bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition" />
        </div>
        <div class="space-y-2">
          <label for="phone" class="block text-sm font-medium">Phone</label>
          <input id="phone" v-model="form.phone" type="text" class="w-full px-3 py-2 rounded-md border border-neutral-300 bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition" />
        </div>
        <div class="flex items-center gap-4">
          <button type="submit" :disabled="saving" class="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium bg-black text-white shadow hover:bg-zinc-800 disabled:opacity-60 transition">
            <span v-if="!saving">Save</span>
            <span v-else class="animate-pulse">Saving...</span>
          </button>
          <span v-if="savedAt" class="text-sm text-green-600">Saved at {{ savedAt }}</span>
        </div>
      </form>

      <div class="bg-white p-8 rounded-2xl shadow border border-neutral-200">
        <div class="mb-4 flex items-center gap-3">
          <button @click="activeTab = 'orders'" :class="tabBtn('orders')">Orders</button>
          <button @click="activeTab = 'shipments'" :class="tabBtn('shipments')">Shipments</button>
        </div>

        <div v-if="activeTab === 'orders'">
          <h2 class="text-lg font-semibold mb-4">Order History</h2>
          <div v-if="ordersLoading" class="text-sm text-zinc-500">Loading orders...</div>
          <div v-else-if="ordersError" class="text-sm text-red-600">{{ ordersError }}</div>
          <div v-else-if="orders.length === 0" class="text-sm text-zinc-500">No orders yet.</div>
          <div v-else class="divide-y divide-neutral-200">
            <div v-for="o in orders" :key="o.id" class="py-3 flex items-center justify-between">
              <div>
                <div class="text-sm font-medium">Order #{{ o.id }}</div>
                <div class="text-xs text-neutral-500">{{ new Date(o.created_at).toLocaleString() }} • {{ o.status }}</div>
              </div>
              <div class="text-sm font-semibold">${{ (o.total_price ?? 0).toFixed(2) }}</div>
            </div>
          </div>
        </div>

        <div v-else>
          <h2 class="text-lg font-semibold mb-4">Shipments</h2>
          <div v-if="shipLoading" class="text-sm text-zinc-500">Loading shipments...</div>
          <div v-else-if="shipError" class="text-sm text-red-600">{{ shipError }}</div>
          <div v-else-if="shipments.length === 0" class="text-sm text-zinc-500">No shipments yet.</div>
          <div v-else class="divide-y divide-neutral-200">
            <div v-for="s in shipments" :key="s.id" class="py-3 flex items-center justify-between">
              <div>
                <div class="text-sm font-medium">Shipment #{{ s.id }} for Order #{{ s.order_id }}</div>
                <div class="text-xs text-neutral-500">{{ formatDate(s.updated_at) }} • {{ s.status }}</div>
                <div v-if="s.tracking_number" class="text-xs text-neutral-600">Tracking: {{ s.tracking_number }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, watchEffect, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { listOrders, listShipments } from '@/services/userResources'

const auth = useAuthStore()
const form = reactive({ name: '', address: '', phone: '' })
const saving = ref(false)
const savedAt = ref<string | null>(null)

type Order = { id: number; created_at: string; status: string; total_price?: number }
const orders = ref<Order[]>([])
const ordersLoading = ref(false)
const ordersError = ref<string | null>(null)
type Shipment = { id: number; order_id: number; status: string; tracking_number?: string; updated_at?: string }
const shipments = ref<Shipment[]>([])
const shipLoading = ref(false)
const shipError = ref<string | null>(null)
const activeTab = ref<'orders' | 'shipments'>('orders')

function tabBtn(name: 'orders' | 'shipments') {
  return [
    'px-4 py-2 rounded-lg text-sm font-medium border transition',
    activeTab.value === name ? 'bg-black text-white border-black' : 'bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-50'
  ].join(' ')
}

function formatDate(v?: string) {
  if (!v) return ''
  const d = new Date(v)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleString()
}

watchEffect(() => {
  if (auth.user) {
    form.name = auth.user.name || ''
    // @ts-ignore custom fields maybe undefined
    form.address = (auth.user as any).address || ''
    // @ts-ignore
    form.phone = (auth.user as any).phone || ''
  }
})

async function onSave() {
  saving.value = true
  try {
    await auth.saveProfile({ name: form.name, address: form.address, phone: form.phone })
    savedAt.value = new Date().toLocaleTimeString()
  } finally {
    saving.value = false
  }
}

async function loadOrders() {
  try {
    ordersLoading.value = true
    const res = await listOrders()
    orders.value = res?.items || []
    ordersError.value = null
  } catch (e: any) {
    ordersError.value = e?.message || 'Failed to load orders'
  } finally {
    ordersLoading.value = false
  }
}

async function loadShipments() {
  try {
    shipLoading.value = true
    const res = await listShipments()
    shipments.value = res?.items || []
    shipError.value = null
  } catch (e: any) {
    shipError.value = e?.message || 'Failed to load shipments'
  } finally {
    shipLoading.value = false
  }
}

onMounted(() => {
  if (auth.token) { loadOrders(); loadShipments() }
})
watch(() => auth.token, (t) => {
  if (t) { loadOrders(); loadShipments() }
  else { orders.value = []; shipments.value = [] }
})
</script>
