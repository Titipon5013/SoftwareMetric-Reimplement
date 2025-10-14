import { defineStore } from 'pinia'
import { getCart, updateCartItem, removeCartItem } from '@/services/userResources'

export type CartProduct = {
  id: number
  name: string
  image?: string | null
  price: number
  promotion_price?: number | null
}
export type CartItem = {
  id: number
  product_id: number
  size?: string | null
  color?: string | null
  quantity: number
  product?: CartProduct | null
}

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [] as CartItem[],
    loading: false as boolean,
    error: null as string | null,
    hydrated: false as boolean,
  }),
  getters: {
    count: (s) => s.items.reduce((n, it) => n + (it.quantity || 0), 0),
    isEmpty: (s) => s.items.length === 0,
  },
  actions: {
    async refresh() {
      try {
        this.loading = true
        const res = await getCart()
        this.items = res?.items || []
        this.error = null
        this.hydrated = true
      } catch (e: any) {
        this.error = e?.message || 'Failed to load cart'
        this.items = []
      } finally {
        this.loading = false
      }
    },
    async inc(itemId: number) {
      const it = this.items.find(x => x.id === itemId)
      if (!it) return
      const newQ = (it.quantity || 0) + 1
      const res = await updateCartItem(String(itemId), { quantity: newQ })
      it.quantity = res?.quantity ?? newQ
    },
    async dec(itemId: number) {
      const it = this.items.find(x => x.id === itemId)
      if (!it) return
      const newQ = Math.max(1, (it.quantity || 0) - 1)
      const res = await updateCartItem(String(itemId), { quantity: newQ })
      it.quantity = res?.quantity ?? newQ
    },
    async remove(itemId: number) {
      await removeCartItem(String(itemId))
      this.items = this.items.filter(x => x.id !== itemId)
    }
  }
})
