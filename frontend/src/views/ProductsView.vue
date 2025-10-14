<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import ProductCard from '@/components/ProductCard.vue'
import { fetchProducts, type Product } from '@/services/products'

type SortKey = 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc'

const route = useRoute()
const query = ref<string>('')
const category = ref<string>('ALL')
const sort = ref<SortKey>('name-asc')

const items = ref<Product[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const limit = ref(20)
const offset = ref(0)
const total = ref<number | undefined>(undefined)
const page = computed({
  get: () => Math.floor(offset.value / limit.value) + 1,
  set: (p: number) => { offset.value = (p - 1) * limit.value }
})
const totalPages = computed(() => total.value ? Math.max(1, Math.ceil(total.value / limit.value)) : 1)

const showPagination = computed(() => {
  if (typeof total.value === 'number') {
    return total.value > limit.value
  }
  // Fallback: if we don't know total, show when page is not the first or we got a full page
  return offset.value > 0 || items.value.length === limit.value
})

const prevEnabled = computed(() => offset.value > 0 && !loading.value)
const nextEnabled = computed(() => {
  if (loading.value) return false
  if (typeof total.value === 'number') return page.value < totalPages.value
  // unknown total: allow next if we received a full page
  return items.value.length === limit.value
})

function scrollToTop() {
  try {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch {}
}

function prevPage() {
  if (!prevEnabled.value) return
  page.value = page.value - 1
  load().then(scrollToTop)
}

function nextPage() {
  if (!nextEnabled.value) return
  page.value = page.value + 1
  load().then(scrollToTop)
}

async function load() {
  try {
    loading.value = true
    const res = await fetchProducts({ limit: limit.value, offset: offset.value })
    items.value = res.items
    total.value = res.total
  } catch (e: any) {
    error.value = e?.message ?? 'Failed to load products'
  } finally {
    loading.value = false
  }
}

onMounted(load)

// hydrate search from route `q` param
watch(() => route.query.q, (q) => {
  if (typeof q === 'string') query.value = q
}, { immediate: true })

// Reset to first page when category or sort change
watch([category, sort], () => {
  offset.value = 0
  // No server-side filter; keep client filter only
})

const categories = computed(() => {
  const set = new Set<string>()
  items.value.forEach(p => { if (p.category) set.add(p.category) })
  return ['ALL', ...Array.from(set)]
})

const filtered = computed(() => {
  let list = items.value.slice()
  if (query.value) {
    const q = query.value.toLowerCase()
    list = list.filter(p => p.name.toLowerCase().includes(q) || (p.description?.toLowerCase().includes(q)))
  }
  if (category.value && category.value !== 'ALL') {
    list = list.filter(p => p.category === category.value)
  }
  switch (sort.value) {
    case 'name-asc':
      list.sort((a, b) => a.name.localeCompare(b.name))
      break
    case 'name-desc':
      list.sort((a, b) => b.name.localeCompare(a.name))
      break
    case 'price-asc':
      list.sort((a, b) => (a.promotion_price ?? a.price) - (b.promotion_price ?? b.price))
      break
    case 'price-desc':
      list.sort((a, b) => (b.promotion_price ?? b.price) - (a.promotion_price ?? a.price))
      break
  }
  return list
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-end justify-between gap-4 flex-wrap">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Products</h1>
        <p class="text-sm text-zinc-500">Explore our latest collection</p>
      </div>
      <div class="flex gap-2 w-full sm:w-auto">
        <input
          id="search-bar"
          v-model="query"
          type="text"
          placeholder="Search products..."
          class="w-full sm:w-64 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-zinc-400 focus:outline-none"
        />
        <select v-model="category" class="rounded-md border border-zinc-300 bg-white px-2 py-2 text-sm shadow-sm">
          <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
        </select>
        <select v-model="sort" class="rounded-md border border-zinc-300 bg-white px-2 py-2 text-sm shadow-sm">
          <option value="name-asc">Name (A→Z)</option>
          <option value="name-desc">Name (Z→A)</option>
          <option value="price-asc">Price (Low→High)</option>
          <option value="price-desc">Price (High→Low)</option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="rounded-md border border-zinc-200 p-8 text-center text-zinc-500">Loading products...</div>

    <div v-else-if="error" class="rounded-md border border-red-200 bg-red-50 p-8 text-center text-red-600">
      {{ error }}
    </div>

    <div v-else-if="filtered.length === 0" class="rounded-md border border-zinc-200 p-8 text-center text-zinc-500">
      No products found.
    </div>

    <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      <ProductCard v-for="p in filtered" :key="p.id" :product="p" />
    </div>

  <div v-if="showPagination" class="mt-6 flex items-center justify-between gap-3">
      <div class="text-sm text-zinc-500">
        Page {{ page }} of {{ totalPages }}
        <span v-if="typeof total === 'number'"> • {{ total }} items</span>
      </div>
      <div class="flex items-center gap-2">
        <button
          class="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm hover:bg-zinc-50 disabled:opacity-50"
          :disabled="page <= 1 || loading"
          @click="prevPage"
        >Prev</button>
        <button
          class="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm hover:bg-zinc-50 disabled:opacity-50"
          :disabled="page >= totalPages || loading"
          @click="nextPage"
        >Next</button>
      </div>
    </div>
  </div>
</template>
