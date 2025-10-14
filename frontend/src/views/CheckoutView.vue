<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showMessage } from '@/composables/useToaster'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
// using single address input only; no saved addresses API

const auth = useAuthStore()
const cart = useCartStore()
const router = useRouter()

const fullName = ref('')
// Address handling (single input)
const address = ref('')
const paymentMethod = ref('')
const agree = ref(false)

const subtotal = computed(() => cart.items.reduce((sum, it) => {
  const price = it.product?.promotion_price ?? it.product?.price ?? 0
  return sum + price * (it.quantity || 0)
}, 0))
const taxRate = 0.06
const shippingCost = 13
const taxAmount = computed(() => +(subtotal.value * taxRate).toFixed(2))
const total = computed(() => +(subtotal.value + shippingCost + taxAmount.value).toFixed(2))

async function place() {
  try {
    if (!agree.value) { showMessage('Please accept terms and conditions', 'warning'); return }
    // Use single shipping address input directly
    const shipping_address = address.value
    if (!shipping_address?.trim()) { showMessage('Please enter shipping address', 'warning'); return }
    const res = await fetch((import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787') + '/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${auth.token}` },
      body: JSON.stringify({ fullname: fullName.value, shipping_address, payment_method: paymentMethod.value || 'card' }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data?.error || 'Failed to place order')
    await cart.refresh()
    router.replace({ name: 'success', query: { id: data.id, subtotal: data.subtotal, tax: data.taxAmount, ship: data.shippingCost, total: data.total } })
  } catch (e: any) {
    showMessage(e?.message || 'Failed to place order', 'error')
  }
}

onMounted(async () => {
  if (!auth.token) {
    router.push({ name: 'login', query: { redirect: '/checkout' } })
    return
  }
  if (!cart.hydrated) await cart.refresh()
  // Prefill from user's profile address if exists
  try {
    address.value = ((auth.user as any)?.address || '').toString()
    fullName.value = ((auth.user as any)?.name || '').toString()
  } catch {}
})
</script>

<template>
  <div class="min-h-[80vh] w-full flex items-start lg:items-center justify-center px-4 py-8">
    <div class="w-full max-w-[1200px]">
      <h1 class="text-2xl font-semibold mb-4">Checkout</h1>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-10">
      <!-- Shipping Information -->
      <div>
        <div class="bg-white rounded-lg shadow-sm border border-zinc-200 p-5">
          <h2 class="text-xl font-semibold mb-4">Shipping Information</h2>
          <form @submit.prevent>
            <div class="mb-3">
              <label for="fullName" class="block text-sm font-medium mb-1">Full Name</label>
              <input id="fullName" v-model="fullName" type="text" class="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" required />
            </div>
            <div class="mb-3">
              <label class="block text-sm font-medium mb-1">Address</label>
              <input id="address" v-model="address" type="text" class="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" placeholder="Enter shipping address" />
            </div>
            <div>
              <h3 class="text-lg font-semibold mb-2">Payment Method</h3>
              <select v-model="paymentMethod" class="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm mb-3" required>
                <option value="">Select payment method</option>
                <option value="credit">Credit Card</option>
                <option value="debit">Debit Card</option>
              </select>
              <div v-if="paymentMethod" class="space-y-3">
                <div>
                  <label for="cardNumber" class="block text-sm font-medium mb-1">Card Number</label>
                  <input id="cardNumber" type="text" inputmode="numeric" placeholder="1234 5678 9012 3456" class="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" />
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label for="expiryDate" class="block text-sm font-medium mb-1">Expiry Date</label>
                    <input id="expiryDate" type="text" placeholder="MM/YY" class="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label for="cvv" class="block text-sm font-medium mb-1">CVV</label>
                    <input id="cvv" type="text" placeholder="123" class="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" />
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        <!-- No add-new modal when using single input -->

        <label class="flex items-center gap-2 justify-end mt-4 text-sm">
          <input type="checkbox" v-model="agree" class="rounded border-zinc-300" />
          I agree to the Terms and Conditions
        </label>

        <button @click="place" class="mt-2 w-full rounded-lg bg-black px-4 py-3 text-white font-medium hover:bg-zinc-800">Continue</button>
      </div>

      <!-- Order Summary -->
      <div>
        <div class="bg-white rounded-lg shadow-sm border border-zinc-200 p-5">
          <h2 class="text-xl font-semibold">Order Summary</h2>
          <div class="divide-y divide-zinc-100 mt-2">
            <div v-for="it in cart.items" :key="it.id" class="product-item flex items-start py-4">
              <img :src="it.product?.image || '/favicon.ico'" :alt="it.product?.name || ''" class="h-24 w-24 object-cover rounded border border-zinc-200 mr-4" />
              <div class="flex-1">
                <div class="product-name font-medium">{{ it.product?.name || `Product #${it.product_id}` }}</div>
                <div class="product-variant text-zinc-600 text-sm">{{ it.color || '-' }}/{{ it.size || '-' }}</div>
                <div class="quantity-controls mt-2 inline-flex items-center gap-2">
                  <button class="quantity-btn rounded border border-zinc-300 w-8 h-8 flex items-center justify-center" @click.prevent="cart.dec(it.id)" :disabled="it.quantity <= 1">−</button>
                  <span class="quantity-display text-sm min-w-[24px] text-center">{{ it.quantity }}</span>
                  <button class="quantity-btn rounded border border-zinc-300 w-8 h-8 flex items-center justify-center" @click.prevent="cart.inc(it.id)">+</button>
                </div>
              </div>
              <div class="product-price text-right font-medium min-w-[80px]">
                ${{ (((it.product?.promotion_price ?? it.product?.price) || 0) * (it.quantity || 0)).toFixed(2) }}
              </div>
            </div>
          </div>
          <div class="summary-totals mt-4 pt-4 border-t border-zinc-200 text-sm">
            <div class="summary-row flex justify-between mb-2"><span>Subtotal</span><span>${{ subtotal.toFixed(2) }}</span></div>
            <div class="summary-row flex justify-between mb-2"><span>Tax (6%)</span><span>${{ taxAmount.toFixed(2) }}</span></div>
            <div class="summary-row flex justify-between mb-2"><span>Shipping</span><span>${{ shippingCost.toFixed(2) }}</span></div>
            <div class="summary-row flex justify-between font-semibold"><span>Total</span><span>${{ total.toFixed(2) }}</span></div>
          </div>
        </div>
      </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@media (max-width: 426px) {
  .product-price { display: none; }
}
</style>