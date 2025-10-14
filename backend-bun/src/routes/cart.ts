import { Hono } from 'hono'
import { supabaseFromRequest } from '../lib/supabase.js'

const app = new Hono()

// GET /cart - list current user's cart items via RLS
app.get('/', async (c) => {
  const sb = supabaseFromRequest(c.req.raw)
  const { data, error } = await sb
    .from('cart')
    .select('id, product_id, size, color, quantity')
    .order('id', { ascending: false })
  if (error) return c.json({ error: error.message }, 400)
  return c.json({ items: data })
})

// POST /cart - add to cart { product_id, size, color, quantity }
app.post('/', async (c) => {
  const body = await c.req.json()
  const sb = supabaseFromRequest(c.req.raw)
  const { data, error } = await sb.from('cart').insert(body).select('*').single()
  if (error) return c.json({ error: error.message }, 400)
  return c.json(data, 201)
})

// DELETE /cart/:id - remove own cart item
app.delete('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const sb = supabaseFromRequest(c.req.raw)
  const { error } = await sb.from('cart').delete().eq('id', id)
  if (error) return c.json({ error: error.message }, 400)
  return c.json({ ok: true })
})

export default app
