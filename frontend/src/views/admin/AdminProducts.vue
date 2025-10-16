<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { adminListProducts, adminDeleteProduct } from '@/services/admin'

const auth = useAuthStore()
const loading = ref(false)
const error = ref<string | null>(null)
const items = ref<any[]>([])
const search = ref('')
const total = ref(0)
const limit = ref(12)
const page = ref(1)
const offset = computed(() => (page.value - 1) * limit.value)
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / limit.value)))

const filtered = computed(() => items.value)

async function load() {
  loading.value = true
  try {
    const res = await adminListProducts({ search: search.value || undefined, limit: limit.value, offset: offset.value }, auth.token || undefined)
    items.value = res.items || []
    total.value = Number(res.total || 0)
    error.value = null
  } catch (e: any) {
    error.value = e?.message || 'Failed to load products'
  } finally {
    loading.value = false
  }
}

async function remove(id: number) {
  if (!confirm('Delete this product?')) return
  await adminDeleteProduct(id, auth.token || undefined)
  await load()
}

function goTo(p: number) {
  if (p < 1 || p > totalPages.value) return
  page.value = p
  load()
}

onMounted(load)
</script>

<template>
  <section>
    <header class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl font-semibold">Products Management</h1>
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
      <div class="flex items-center gap-2">
        <input v-model="search" @keyup.enter="() => { page = 1; load() }" placeholder="Search products" class="border rounded px-3 py-2" />
        <button @click="load" class="rounded bg-black text-white px-4 py-2">Search</button>
        <RouterLink to="/admin/products/new" class="rounded bg-emerald-600 text-white px-4 py-2">+ Add</RouterLink>
      </div>
    </header>
    <div v-if="loading">Loading...</div>
    <div v-else>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div v-for="p in filtered" :key="p.id" class="rounded border overflow-hidden">
          <img :src="p.image" :alt="p.name" class="w-full h-40 object-cover" />
          <div class="p-3 space-y-2">
            <div class="font-semibold">{{ p.name }}</div>
            <div class="text-sm text-slate-600">${{ Number(p.price).toFixed(2) }}<span v-if="p.promotion_price" class="ml-2 text-red-600 font-semibold">${{ Number(p.promotion_price).toFixed(2) }}</span></div>
            <div class="flex gap-2">
              <RouterLink :to="{ name: 'admin-product-edit', params: { id: p.id } }" class="rounded bg-slate-800 text-white px-3 py-1 text-xs">Edit</RouterLink>
              <button @click="remove(p.id)" class="rounded bg-red-600 text-white px-3 py-1 text-xs">Delete</button>
            </div>
          </div>
        </div>
      </div>
      <div class="mt-6 flex items-center justify-center gap-2" v-if="totalPages > 1">
        <button class="px-3 py-1 rounded border" :disabled="page === 1" @click="goTo(page - 1)">Prev</button>
        <span class="text-sm">Page {{ page }} / {{ totalPages }}</span>
        <button class="px-3 py-1 rounded border" :disabled="page === totalPages" @click="goTo(page + 1)">Next</button>
      </div>
    </div>
  </section>
</template>
