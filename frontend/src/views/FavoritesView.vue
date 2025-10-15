<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { listFavorites, removeFavorite } from '@/services/userResources'
import { showMessage } from '@/composables/useToaster'
import { useRouter } from 'vue-router'
import { useFavoritesStore } from '@/stores/favorites'

type FavItem = {
  id: string | number
  product_id: number
  name: string
  image?: string | null
  category_name?: string | null
  price?: number | null
  promotion_price?: number | null
}

const items = ref<FavItem[]>([])
const loading = ref(false)
const router = useRouter()
const favorites = useFavoritesStore()

const uniqueItems = computed(() => {
  const seen = new Set<number>()
  const out: FavItem[] = []
  for (const f of items.value) {
    if (!seen.has(f.product_id)) { seen.add(f.product_id); out.push(f) }
  }
  return out
})

async function load() {
  loading.value = true
  try {
    const res = await listFavorites()
    items.value = res?.items || res || []
  } catch (e: any) {
    showMessage(e?.message || 'Failed to load favorites', 'error')
  } finally {
    loading.value = false
  }
}

async function remove(id: string | number) {
  try {
    await removeFavorite(String(id))
    showMessage('Removed from favorites', 'success')
    await load()
    await favorites.refresh()
  } catch (e: any) {
    showMessage(e?.message || 'Failed to remove', 'error')
  }
}

onMounted(load)
</script>

<template>
  <section class="min-h-[70vh] w-full px-4 py-8">
    <div class="max-w-6xl mx-auto">
      <nav class="text-sm text-zinc-600 mb-4">
        <router-link to="/" class="hover:underline">Home</router-link>
        <span class="mx-1">/</span>
        <router-link to="/favorites" class="hover:underline">❤️ Favorites</router-link>
      </nav>
      <h2 class="text-2xl font-bold mb-6">FAVORITES ITEM</h2>

      <div v-if="loading" class="text-zinc-500">Loading...</div>
      <div v-else>
        <div v-if="uniqueItems.length > 0" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div v-for="fav in uniqueItems" :key="fav.product_id" class="relative group border rounded-lg overflow-hidden bg-white">
            <button @click="remove(fav.id)" class="absolute top-2 right-2 z-10 h-8 w-8 rounded-full bg-white/90 border border-zinc-200 flex items-center justify-center text-zinc-700 hover:bg-zinc-50" title="Remove from favorites">&times;</button>

            <router-link :to="{ name: 'product-detail', params: { id: fav.product_id }, query: { product_id: fav.product_id } }">
              <img :src="fav.image || '/favicon.ico'" :alt="fav.name" class="h-60 w-full object-cover" />
            </router-link>

            <div class="p-4">
              <h3 class="text-base font-semibold line-clamp-2">{{ fav.name }}</h3>
              <p class="text-sm text-zinc-600">{{ fav.category_name }}</p>
              <p class="mt-1">
                <template v-if="fav.promotion_price">
                  <span class="line-through text-zinc-500 mr-2">${{ fav.price }}</span>
                  <span class="text-red-600 font-bold">${{ fav.promotion_price }}</span>
                  <span class="ml-2 inline-block text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                    -{{ Math.round(((Number(fav.price) - Number(fav.promotion_price)) / Number(fav.price)) * 100) }}%
                  </span>
                </template>
                <template v-else>
                  ${{ fav.price }}
                </template>
              </p>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-16 text-zinc-600">No favorite products found</div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-clamp: 2; }
</style>