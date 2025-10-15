<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { adminListProducts, adminDeleteProduct } from '@/services/admin'

const auth = useAuthStore()
const loading = ref(false)
const error = ref<string | null>(null)
const items = ref<any[]>([])
const search = ref('')

const filtered = computed(() => items.value)

async function load() {
  loading.value = true
  try {
    const res = await adminListProducts({ search: search.value || undefined }, auth.token || undefined)
    items.value = res.items || []
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

onMounted(load)
</script>

<template>
  <section>
    <header class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl font-semibold">Products Management</h1>
      <RouterLink to="/admin" class="text-sm text-slate-600 underline">Back to Dashboard</RouterLink>
      <div class="flex items-center gap-2">
        <input v-model="search" @keyup.enter="load" placeholder="Search products" class="border rounded px-3 py-2" />
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
    </div>
  </section>
</template>
