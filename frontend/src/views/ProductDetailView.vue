<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchProductById, type Product } from '@/services/products'

const route = useRoute()
const router = useRouter()

const id = Number(route.params.id)
const product = ref<Product | undefined>(undefined)
const loading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    loading.value = true
    const data = await fetchProductById(id)
    if (!data) {
      router.replace({ name: 'products' })
      return
    }
    product.value = data
  } catch (e: any) {
    error.value = e?.message ?? 'Failed to load product'
  } finally {
    loading.value = false
  }
})

const selectedSize = ref<string | undefined>(undefined)
const selectedColor = ref<string | undefined>(undefined)
watch(product, (p) => {
  if (!p) return
  selectedSize.value = p.sizes?.[0]
  selectedColor.value = p.colors?.[0]
})

const qty = ref(1)
const inc = () => qty.value = Math.max(1, qty.value + 1)
const dec = () => qty.value = Math.max(1, qty.value - 1)

const finalPrice = computed(() => product.value ? (product.value.promotion_price ?? product.value.price) : 0)
const hasPromo = computed(() => product.value?.promotion_price && (product.value.promotion_price < product.value.price))
const discountPct = computed(() => product.value && product.value.promotion_price
  ? Math.round((1 - (product.value.promotion_price / product.value.price)) * 100)
  : 0
)

function addToCart() {
  // Placeholder: integrate with backend cart API later
  alert(`Added to cart: ${product.value?.name} x${qty.value}${selectedSize.value ? ' - ' + selectedSize.value : ''}${selectedColor.value ? ' / ' + selectedColor.value : ''}`)
}
</script>

<template>
  <div v-if="loading" class="rounded-md border border-zinc-200 p-8 text-center text-zinc-500">Loading...</div>
  <div v-else-if="error" class="rounded-md border border-red-200 bg-red-50 p-8 text-center text-red-600">{{ error }}</div>
  <div v-else-if="product" class="grid grid-cols-1 md:grid-cols-2 gap-8">
    <!-- Left: Single Image Only -->
    <div>
      <div class="aspect-square overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
        <img :src="product.image" :alt="product.name" class="h-full w-full object-cover" />
      </div>
    </div>

    <!-- Right: Details Panel -->
    <div class="md:sticky md:top-16 space-y-5">
      <div>
        <h1 class="text-2xl font-semibold text-zinc-900">{{ product.name }}</h1>
        <p class="mt-1 text-sm text-zinc-500">
          <span v-if="product.brand">{{ product.brand }}</span>
          <span v-if="product.brand && product.category"> • </span>
          <span v-if="product.category">{{ product.category }}</span>
        </p>
      </div>

      <div class="flex items-center gap-3">
        <span class="text-3xl font-bold tracking-tight">${{ finalPrice.toFixed(2) }}</span>
        <span v-if="hasPromo" class="text-sm text-zinc-400 line-through">${{ product.price.toFixed(2) }}</span>
        <span v-if="hasPromo" class="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">-{{ discountPct }}%</span>
      </div>

      <div v-if="product.sizes?.length" class="">
        <p class="text-sm font-medium">Size</p>
        <div class="mt-2 flex flex-wrap gap-2">
          <button
            v-for="s in product.sizes"
            :key="s"
            @click="selectedSize = s"
            class="min-w-[3rem] rounded-lg border px-3 py-1.5 text-sm transition-colors"
            :class="selectedSize === s ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-300 bg-white text-zinc-900 hover:border-zinc-400'"
          >
            {{ s }}
          </button>
        </div>
      </div>

      <div v-if="product.colors?.length" class="">
        <p class="text-sm font-medium">Color</p>
        <div class="mt-2 flex flex-wrap gap-2">
          <button
            v-for="c in product.colors"
            :key="c"
            @click="selectedColor = c"
            class="rounded-lg border px-3 py-1.5 text-sm transition-colors"
            :class="selectedColor === c ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-300 bg-white text-zinc-900 hover:border-zinc-400'"
          >
            {{ c }}
          </button>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <label class="text-sm text-zinc-600" for="qty">Quantity</label>
        <div class="inline-flex items-center rounded-lg border border-zinc-300">
          <button @click="dec" class="h-9 w-9 select-none text-lg leading-none hover:bg-zinc-50">−</button>
          <input id="qty" v-model.number="qty" type="number" min="1" class="w-14 border-x border-zinc-300 text-center outline-none [appearance:textfield] [-moz-appearance:textfield]" />
          <button @click="inc" class="h-9 w-9 select-none text-lg leading-none hover:bg-zinc-50">+</button>
        </div>
      </div>

      <div class="flex gap-3">
        <button @click="addToCart" class="w-full sm:w-auto sm:min-w-[220px] rounded-lg bg-zinc-900 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800">Add to Cart</button>
        <button
          type="button"
          class="inline-flex h-12 w-12 items-center justify-center rounded-lg border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50"
          aria-label="Add to favorites"
          title="Add to favorites"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-5 w-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/>
          </svg>
        </button>
      </div>

      <div v-if="product.description" class="pt-4 border-t border-zinc-200">
        <h2 class="text-sm font-semibold">Description</h2>
        <p class="mt-2 text-sm leading-6 text-zinc-600">{{ product.description }}</p>
      </div>
    </div>
  </div>
</template>
