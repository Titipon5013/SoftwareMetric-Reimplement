<script setup lang="ts">
import { useRoute, RouterLink } from 'vue-router'
const route = useRoute()
const orderId = route.query.id as string | undefined
const subtotal = route.query.subtotal as string | undefined
const tax = route.query.tax as string | undefined
const ship = route.query.ship as string | undefined
const total = route.query.total as string | undefined
</script>

<template>
  <div class="min-h-[80vh] w-full flex items-center justify-center px-4">
    <div class="w-full max-w-xl text-center space-y-6">
      <div class="text-6xl">✅</div>
      <h1 class="text-2xl font-semibold">Your Order is Confirmed!</h1>
      <p class="text-zinc-600">Thank you for shopping with CJ Streetwear. Your order has been placed successfully.</p>
      <div v-if="orderId" class="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-left">
        <div class="text-sm">Order ID: <span class="font-medium">#{{ orderId }}</span></div>
        <div class="mt-3 space-y-1 text-sm">
          <div class="flex justify-between"><span>Subtotal</span><span>${{ subtotal }}</span></div>
          <div class="flex justify-between"><span>Tax</span><span>${{ tax }}</span></div>
          <div class="flex justify-between"><span>Shipping</span><span>${{ ship }}</span></div>
          <div class="flex justify-between font-semibold"><span>Total</span><span>${{ total }}</span></div>
        </div>
      </div>
      <div class="flex items-center justify-center gap-3">
        <RouterLink to="/" class="rounded-lg bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-800">Continue Shopping</RouterLink>
        <RouterLink to="/profile" class="rounded-lg border border-zinc-300 px-4 py-2 hover:bg-zinc-50">View Order History</RouterLink>
      </div>
    </div>
  </div>
  
</template>

<style scoped></style>