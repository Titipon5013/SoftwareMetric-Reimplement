import { Hono } from 'hono'
import { supabaseFromRequest } from '../lib/supabase.js'

const app = new Hono()

// GET /orders - list own orders
app.get('/', async (c) => {
  const sb = supabaseFromRequest(c.req.raw)
  const { data, error } = await sb.from('orders').select('*').order('created_at', { ascending: false })
  if (error) return c.json({ error: error.message }, 400)
  return c.json({ items: data })
})

// GET /orders/:id - view own order detail + items
app.get('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const sb = supabaseFromRequest(c.req.raw)
  const { data: order, error } = await sb.from('orders').select('*').eq('id', id).single()
  if (error || !order) return c.json({ error: 'Not found' }, 404)
  const { data: items } = await sb
    .from('order_items')
    .select('id, product_id, quantity, price, size, color')
    .eq('order_id', id)
  return c.json({ order, items })
})

// POST /orders - create order with items[]; relies on RLS check of user_id
app.post('/', async (c) => {
  const body = await c.req.json()
  const sb = supabaseFromRequest(c.req.raw)
  const { user_id, fullname, shipping_address, payment_method, status, subtotal, tax_amount, shipping_cost, total_price, items } = body
  const { data: order, error } = await sb
    .from('orders')
    .insert({ user_id, fullname, shipping_address, payment_method, status, subtotal, tax_amount, shipping_cost, total_price })
    .select('*')
    .single()
  if (error) return c.json({ error: error.message }, 400)
  if (Array.isArray(items) && items.length > 0) {
    const rows = items.map((it: any) => ({
      order_id: order.id,
      product_id: it.product_id,
      quantity: it.quantity,
      price: it.price,
      size: it.size,
      color: it.color,
    }))
    const { error: itemsErr } = await sb.from('order_items').insert(rows)
    if (itemsErr) return c.json({ error: itemsErr.message }, 400)
  }
  return c.json({ ok: true, id: order.id })
})

export default app
