import { defineStore } from 'pinia'
import { listFavorites } from '@/services/userResources'

export type FavoriteItem = {
  id: string | number
  product_id: number
  name: string
  image?: string | null
  category_name?: string | null
  price?: number | null
  promotion_price?: number | null
}

export const useFavoritesStore = defineStore('favorites', {
  state: () => ({
    items: [] as FavoriteItem[],
    loading: false as boolean,
    error: null as string | null,
    hydrated: false as boolean,
  }),
  getters: {
    // Count unique products by product_id
    count: (s) => {
      const seen = new Set<number>()
      for (const it of s.items) seen.add(it.product_id)
      return seen.size
    },
    isEmpty: (s): boolean => s.items.length === 0,
  },
  actions: {
    async refresh() {
      try {
        this.loading = true
        const res = await listFavorites()
        this.items = (res?.items || res || []) as FavoriteItem[]
        this.error = null
        this.hydrated = true
      } catch (e: any) {
        this.error = e?.message || 'Failed to load favorites'
        this.items = []
      } finally {
        this.loading = false
      }
    },
  }
})
