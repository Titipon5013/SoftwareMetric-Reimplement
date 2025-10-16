<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { adminListCategories, adminAddCategory, adminEditCategory, adminDeleteCategory } from '@/services/admin'

const auth = useAuthStore()
const loading = ref(false)
const error = ref<string | null>(null)
const categories = ref<any[]>([])
const newName = ref('')

async function load() {
  loading.value = true
  try {
    const res = await adminListCategories(auth.token || undefined)
    categories.value = res.items || []
    error.value = null
  } catch (e: any) {
    error.value = e?.message || 'Failed to load categories'
  } finally {
    loading.value = false
  }
}

async function add() {
  if (!newName.value.trim()) return
  await adminAddCategory(newName.value.trim(), auth.token || undefined)
  newName.value = ''
  await load()
}

async function edit(cat: any) {
  await adminEditCategory(cat.id, cat.category_name, auth.token || undefined)
  await load()
}

async function remove(cat: any) {
  await adminDeleteCategory(cat.id, auth.token || undefined)
  await load()
}

onMounted(load)
</script>

<template>
  <section>
    <header class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl font-semibold">Manage Categories</h1>
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
    <div class="mb-4 flex gap-2">
      <input v-model="newName" placeholder="Category Name" class="border rounded px-3 py-2" />
      <button @click="add" class="rounded bg-black text-white px-4 py-2">Add</button>
    </div>
    <table class="w-full border text-sm">
      <thead class="bg-slate-50">
        <tr>
          <th class="p-2 border">Category Name</th>
          <th class="p-2 border">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="c in categories" :key="c.id">
          <td class="p-2 border">
            <input v-model="c.category_name" class="border rounded px-2 py-1 w-full" />
          </td>
          <td class="p-2 border">
            <button @click="edit(c)" class="mr-2 rounded bg-emerald-600 text-white px-3 py-1 text-xs">Save</button>
            <button @click="remove(c)" class="rounded bg-red-600 text-white px-3 py-1 text-xs">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>
