<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { adminListInventory, adminAddInventory, adminPatchInventory, adminDeleteInventory } from '@/services/admin'

const auth = useAuthStore()
const loading = ref(false)
const error = ref<string | null>(null)
const items = ref<any[]>([])
const filterProductId = ref<string>('')

const form = ref({ product_id: '', color: '', size: '', stock: '' })

async function load() {
  loading.value = true
  try {
    const res = await adminListInventory(filterProductId.value ? { product_id: Number(filterProductId.value) } : {}, auth.token || undefined)
    items.value = res.items || []
    error.value = null
  } catch (e: any) {
    error.value = e?.message || 'Failed to load inventory'
  } finally {
    loading.value = false
  }
}

async function addItem() {
  await adminAddInventory({ product_id: Number(form.value.product_id), color: form.value.color, size: form.value.size, stock: Number(form.value.stock) }, auth.token || undefined)
  form.value = { product_id: '', color: '', size: '', stock: '' }
  await load()
}

async function saveItem(it: any) {
  await adminPatchInventory(it.id, { color: it.color, size: it.size, stock: Number(it.stock) }, auth.token || undefined)
  await load()
}

async function removeItem(it: any) {
  await adminDeleteInventory(it.id, auth.token || undefined)
  await load()
}

onMounted(load)
</script>

<template>
  <section>
    <header class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl font-semibold">Inventory Management</h1>
      <RouterLink to="/admin" class="text-sm text-slate-600 underline">Back to Dashboard</RouterLink>
    </header>

    <div class="mb-4 flex items-center gap-2">
      <input v-model="filterProductId" placeholder="Filter by Product ID" class="border rounded px-3 py-2" />
      <button @click="load" class="rounded bg-black text-white px-4 py-2">Filter</button>
    </div>

    <form @submit.prevent="addItem" class="mb-4 grid grid-cols-1 md:grid-cols-5 gap-2">
      <input v-model="form.product_id" placeholder="Product ID" required class="border rounded px-3 py-2" />
      <input v-model="form.color" placeholder="Color" required class="border rounded px-3 py-2" />
      <input v-model="form.size" placeholder="Size" required class="border rounded px-3 py-2" />
      <input v-model="form.stock" type="number" placeholder="Stock" required class="border rounded px-3 py-2" />
      <button type="submit" class="rounded bg-emerald-600 text-white px-4 py-2">Add</button>
    </form>

    <table class="w-full border text-sm">
      <thead class="bg-slate-50">
        <tr>
          <th class="p-2 border">Product ID</th>
          <th class="p-2 border">Color</th>
          <th class="p-2 border">Size</th>
          <th class="p-2 border">Stock</th>
          <th class="p-2 border">Last Updated</th>
          <th class="p-2 border">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="it in items" :key="it.id">
          <td class="p-2 border">{{ it.product_id }}</td>
          <td class="p-2 border"><input v-model="it.color" class="border rounded px-2 py-1 w-full" /></td>
          <td class="p-2 border"><input v-model="it.size" class="border rounded px-2 py-1 w-full" /></td>
          <td class="p-2 border"><input v-model.number="it.stock" type="number" class="border rounded px-2 py-1 w-full" /></td>
          <td class="p-2 border">{{ it.last_updated }}</td>
          <td class="p-2 border">
            <button @click="saveItem(it)" class="mr-2 rounded bg-slate-800 text-white px-3 py-1 text-xs">Save</button>
            <button @click="removeItem(it)" class="rounded bg-red-600 text-white px-3 py-1 text-xs">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>
