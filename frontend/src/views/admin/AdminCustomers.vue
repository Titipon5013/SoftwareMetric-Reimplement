<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { adminListCustomers, adminAddCustomer, adminEditCustomer, adminDeleteCustomer } from '@/services/admin'

const auth = useAuthStore()
const loading = ref(false)
const error = ref<string | null>(null)
const customers = ref<any[]>([])
const search = ref('')

const form = ref({ name: '', email: '', password: '', address: '', phone: '' })

async function load() {
  loading.value = true
  try {
    const res = await adminListCustomers({ search: search.value || undefined }, auth.token || undefined)
    customers.value = res.items || []
    error.value = null
  } catch (e: any) {
    error.value = e?.message || 'Failed to load customers'
  } finally {
    loading.value = false
  }
}

async function add() {
  await adminAddCustomer({ ...form.value }, auth.token || undefined)
  form.value = { name: '', email: '', password: '', address: '', phone: '' }
  await load()
}

async function save(c: any) {
  await adminEditCustomer(c.id, { name: c.name, email: c.email, password: c.password, address: c.address, phone: c.phone }, auth.token || undefined)
  await load()
}

async function remove(c: any) {
  await adminDeleteCustomer(c.id, auth.token || undefined)
  await load()
}

onMounted(load)
</script>

<template>
  <section>
    <header class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl font-semibold">Customer Management</h1>
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

    <div class="mb-4 flex items-center gap-2">
      <input v-model="search" placeholder="Search by name or email" class="border rounded px-3 py-2" />
      <button @click="load" class="rounded bg-black text-white px-4 py-2">Search</button>
    </div>

    <form @submit.prevent="add" class="mb-4 grid grid-cols-1 md:grid-cols-6 gap-2">
      <input v-model="form.name" placeholder="Name" required class="border rounded px-3 py-2" />
      <input v-model="form.email" type="email" placeholder="Email" required class="border rounded px-3 py-2" />
      <input v-model="form.password" type="password" placeholder="Password" required class="border rounded px-3 py-2" />
      <input v-model="form.address" placeholder="Address" required class="border rounded px-3 py-2" />
      <input v-model="form.phone" placeholder="Phone" required class="border rounded px-3 py-2" />
      <button type="submit" class="rounded bg-emerald-600 text-white px-4 py-2">Add Customer</button>
    </form>

    <table class="w-full border text-sm">
      <thead class="bg-slate-50">
        <tr>
          <th class="p-2 border">Name</th>
          <th class="p-2 border">Email</th>
          <th class="p-2 border">Address</th>
          <th class="p-2 border">Phone</th>
          <th class="p-2 border">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="c in customers" :key="c.id">
          <td class="p-2 border"><input v-model="c.name" class="border rounded px-2 py-1 w-full" /></td>
          <td class="p-2 border"><input v-model="c.email" class="border rounded px-2 py-1 w-full" /></td>
          <td class="p-2 border"><input v-model="c.address" class="border rounded px-2 py-1 w-full" /></td>
          <td class="p-2 border"><input v-model="c.phone" class="border rounded px-2 py-1 w-full" /></td>
          <td class="p-2 border">
            <button @click="save(c)" class="mr-2 rounded bg-slate-800 text-white px-3 py-1 text-xs">Save</button>
            <button @click="remove(c)" class="rounded bg-red-600 text-white px-3 py-1 text-xs">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>
