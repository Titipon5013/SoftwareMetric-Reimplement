<script setup lang="ts">
import { computed } from 'vue'
import type { Product } from '@/services/products'

const props = defineProps<{
  product: Product
}>()

const finalPrice = computed(() => props.product.promotion_price ?? props.product.price)
const hasPromo = computed(() => props.product.promotion_price && props.product.promotion_price < props.product.price)
</script>

<template>
  <div class="group rounded-lg border border-zinc-200/60 hover:border-zinc-400 transition-colors bg-white overflow-hidden shadow-sm hover:shadow-md">
    <router-link :to="{ name: 'product-detail', params: { id: product.id } }" class="block">
      <div class="relative aspect-[4/3] bg-zinc-50 overflow-hidden">
        <img :src="product.image" :alt="product.name" class="h-full w-full object-cover group-hover:scale-[1.03] transition-transform duration-300" />
        <span v-if="hasPromo" class="absolute left-2 top-2 rounded bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">SALE</span>
      </div>
      <div class="p-3">
        <h3 class="line-clamp-2 text-sm font-medium text-zinc-900">{{ product.name }}</h3>
        <div class="mt-2 flex items-center gap-2">
          <span class="text-base font-semibold text-zinc-900">${{ finalPrice.toFixed(2) }}</span>
          <span v-if="hasPromo" class="text-xs text-zinc-400 line-through">${{ product.price.toFixed(2) }}</span>
        </div>
        <p class="mt-1 text-xs text-zinc-500">
          <span v-if="product.brand">{{ product.brand }}</span>
          <span v-if="product.brand && product.category"> • </span>
          <span v-if="product.category">{{ product.category }}</span>
        </p>
      </div>
    </router-link>
  </div>
  
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical; 
  overflow: hidden;
  line-clamp: 2;
}
</style>
