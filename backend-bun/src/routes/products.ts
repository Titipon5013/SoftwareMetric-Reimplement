import { Hono } from 'hono'
import { admin } from '../lib/supabase.js'

const app = new Hono()

// GET /products?limit=20&offset=0
app.get('/', async (c) => {
  const limit = Number(c.req.query('limit') ?? 20)
  const offset = Number(c.req.query('offset') ?? 0)
  const { data, error } = await admin
    .from('products')
    .select('*')
    .range(offset, offset + limit - 1)
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ items: data })
})

// GET /products/:id
app.get('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const { data, error } = await admin.from('products').select('*').eq('id', id).single()
  if (error) return c.json({ error: error.message }, 404)
  return c.json(data)
})

export default app
