<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { adminCreateProduct, adminGetProduct, adminUpdateProduct } from '@/services/admin'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const isNew = route.params.id === 'new'
const id = isNew ? null : Number(route.params.id)

const form = ref({
  name: '',
  image: '',
  price: '',
  promotion_price: '',
  description: '',
  size: [] as string[],
  colors: [] as string[],
  category_ids: '' as string, // comma-separated
})

onMounted(async () => {
  if (!isNew && id) {
    const res = await adminGetProduct(id, auth.token || undefined)
    const { product, category_ids } = res
    form.value.name = product.name || ''
    form.value.image = product.image || ''
    form.value.price = String(product.price || '')
    form.value.promotion_price = product.promotion_price != null ? String(product.promotion_price) : ''
    form.value.description = product.description || ''
    form.value.size = Array.isArray(product.size) ? product.size : []
    form.value.colors = Array.isArray(product.colors) ? product.colors : []
    form.value.category_ids = Array.isArray(category_ids) ? category_ids.join(',') : ''
  }
})

async function save() {
  const payload = {
    name: form.value.name.trim(),
    image: form.value.image.trim() || null,
    price: Number(form.value.price),
    promotion_price: form.value.promotion_price ? Number(form.value.promotion_price) : null,
    description: form.value.description.trim() || null,
    size: form.value.size,
    colors: form.value.colors,
    category_ids: form.value.category_ids
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .map(Number),
  }
  if (isNew) {
    await adminCreateProduct(payload, auth.token || undefined)
  } else if (id) {
    await adminUpdateProduct(id, payload, auth.token || undefined)
  }
  router.replace({ name: 'admin-products' })
}
</script>

<template>
  <section>
    <header class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl font-semibold">{{ isNew ? 'Add Product' : 'Edit Product' }}</h1>
      <RouterLink
        :to="{ name: 'admin-products' }"
        class="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition"
        aria-label="Back to Products"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-4 w-4">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        <span>Back to Products</span>
      </RouterLink>
    </header>
    <div class="grid grid-cols-1 gap-4 max-w-2xl">
      <label class="block">
        <span class="text-sm">Product Name</span>
        <input v-model="form.name" class="w-full border rounded px-3 py-2" />
      </label>
      <label class="block">
        <span class="text-sm">Image URL</span>
        <input v-model="form.image" class="w-full border rounded px-3 py-2" />
      </label>
      <label class="block">
        <span class="text-sm">Price</span>
        <input v-model="form.price" type="number" step="0.01" class="w-full border rounded px-3 py-2" />
      </label>
      <label class="block">
        <span class="text-sm">Promotion Price</span>
        <input v-model="form.promotion_price" type="number" step="0.01" class="w-full border rounded px-3 py-2" />
      </label>
      <label class="block">
        <span class="text-sm">Description</span>
        <textarea v-model="form.description" class="w-full border rounded px-3 py-2"></textarea>
      </label>
      <label class="block">
        <span class="text-sm">Sizes (hold Ctrl to select multiple)</span>
        <select v-model="form.size" multiple class="w-full border rounded px-3 py-2">
          <option value="S">S</option>
          <option value="M">M</option>
          <option value="L">L</option>
          <option value="XL">XL</option>
        </select>
      </label>
      <label class="block">
        <span class="text-sm">Colors (hold Ctrl to select multiple)</span>
        <select v-model="form.colors" multiple class="w-full border rounded px-3 py-2">
          <option>Black</option>
          <option>White</option>
          <option>Blue</option>
          <option>Red</option>
          <option>Green</option>
          <option>Navy</option>
        </select>
      </label>
      <label class="block">
        <span class="text-sm">Category IDs (comma separated)</span>
        <input v-model="form.category_ids" class="w-full border rounded px-3 py-2" />
      </label>
      <div>
        <button @click="save" class="rounded bg-black text-white px-4 py-2">Save</button>
      </div>
    </div>
  </section>
</template>
