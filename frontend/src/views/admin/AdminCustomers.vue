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
      <RouterLink to="/admin" class="text-sm text-slate-600 underline">Back to Dashboard</RouterLink>
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
