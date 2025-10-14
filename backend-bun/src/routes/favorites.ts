import { Hono } from 'hono'
import { supabaseFromRequest } from '../lib/supabase.js'

const app = new Hono()

// GET /favorites
app.get('/', async (c) => {
  const sb = supabaseFromRequest(c.req.raw)
  const { data, error } = await sb.from('favorites').select('id, product_id, created_at').order('created_at', { ascending: false })
  if (error) return c.json({ error: error.message }, 400)
  return c.json({ items: data })
})

// POST /favorites { product_id }
app.post('/', async (c) => {
  const body = await c.req.json()
  const sb = supabaseFromRequest(c.req.raw)
  const { data, error } = await sb.from('favorites').insert({ product_id: body.product_id }).select('*').single()
  if (error) return c.json({ error: error.message }, 400)
  return c.json(data, 201)
})

// DELETE /favorites/:id
app.delete('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const sb = supabaseFromRequest(c.req.raw)
  const { error } = await sb.from('favorites').delete().eq('id', id)
  if (error) return c.json({ error: error.message }, 400)
  return c.json({ ok: true })
})

export default app
