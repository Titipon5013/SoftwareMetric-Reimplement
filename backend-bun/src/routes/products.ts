import { Hono } from 'hono'
import { admin } from '../lib/supabase.js'

const app = new Hono()

// GET /products?limit=20&offset=0
app.get('/', async (c) => {
  const limit = Math.max(1, Math.min(100, Number(c.req.query('limit') ?? 20)))
  const offset = Math.max(0, Number(c.req.query('offset') ?? 0))
  const { data, error, count } = await admin
    .from('products')
    .select('*', { count: 'exact' })
    .range(offset, offset + limit - 1)
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ items: data ?? [], total: count ?? 0, limit, offset })
})

// GET /products/:id
app.get('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const { data: product, error } = await admin.from('products').select('*').eq('id', id).single()
  if (error || !product) return c.json({ error: 'Not found' }, 404)
  // fetch inventory variants
  const { data: inventory, error: invErr } = await admin.from('inventory').select('*').eq('product_id', id)
  if (invErr) {
    // still return product even if inventory fails
    return c.json({ ...product, inventory: [] })
  }
  return c.json({ ...product, inventory: inventory || [] })
})

export default app
