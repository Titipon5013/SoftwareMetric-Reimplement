<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showMessage } from '@/composables/useToaster'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'

const auth = useAuthStore()
const cart = useCartStore()
const router = useRouter()

const total = computed(() => cart.items.reduce((sum, it) => {
  const price = it.product?.promotion_price ?? it.product?.price ?? 0
  return sum + price * (it.quantity || 0)
}, 0))

async function inc(id: number) {
  try {
    await cart.inc(id)
  } catch (e: any) {
    showMessage(e?.message || 'Failed to update quantity', 'error')
  }
}
async function dec(id: number) {
  try {
    await cart.dec(id)
  } catch (e: any) {
    showMessage(e?.message || 'Failed to update quantity', 'error')
  }
}
async function removeItem(id: number) {
  try {
    await cart.remove(id)
    showMessage('Removed item from cart', 'success')
  } catch (e: any) {
    showMessage(e?.message || 'Failed to remove item', 'error')
  }
}

onMounted(async () => {
  if (!auth.token) {
    router.push({ name: 'login', query: { redirect: '/cart' } })
  } else {
    await cart.refresh()
  }
})
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">Your Cart</h1>
      <p class="text-sm text-zinc-500">Review your items before checkout</p>
    </div>

  <div v-if="cart.loading" class="rounded-md border border-zinc-200 p-8 text-center text-zinc-500">Loading cart...</div>
  <div v-else-if="cart.error" class="rounded-md border border-red-200 bg-red-50 p-8 text-center text-red-600">{{ cart.error }}</div>
  <div v-else-if="cart.items.length === 0" class="rounded-md border border-zinc-200 p-8 text-center text-zinc-500">Your cart is empty.</div>

    <div v-else class="space-y-3">
      <div v-for="it in cart.items" :key="it.id" class="flex items-center gap-4 rounded-lg border border-zinc-200 p-4">
        <img :src="it.product?.image || '/favicon.ico'" alt="" class="h-16 w-16 rounded object-cover border border-zinc-200" />
        <div class="flex-1">
          <div class="font-medium">{{ it.product?.name || `Product #${it.product_id}` }}</div>
          <div class="text-xs text-zinc-500">Size: {{ it.size || '-' }} • Color: {{ it.color || '-' }}</div>
          <div class="text-sm text-zinc-700">
            ${{ ((it.product?.promotion_price ?? it.product?.price) || 0).toFixed(2) }}
          </div>
        </div>
        <div class="inline-flex items-center rounded-lg border border-zinc-300">
          <button @click="dec(it.id)" class="h-9 w-9 select-none text-lg leading-none hover:bg-zinc-50" :disabled="it.quantity <= 1">−</button>
          <div class="w-12 border-x border-zinc-300 text-center leading-9 select-none">{{ it.quantity }}</div>
          <button @click="inc(it.id)" class="h-9 w-9 select-none text-lg leading-none hover:bg-zinc-50">+</button>
        </div>
        <button @click="removeItem(it.id)" class="text-zinc-600 hover:text-red-600">Remove</button>
      </div>

      <div class="flex flex-col sm:flex-row sm:items-center justify-end gap-4 pt-4 border-t border-zinc-200">
        <div class="text-sm text-zinc-600">Subtotal</div>
        <div class="text-xl font-semibold">${{ total.toFixed(2) }}</div>
        <RouterLink :to="{ name: 'checkout' }" class="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800">Checkout</RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped></style>