import { Hono } from 'hono'
import { admin } from '../lib/supabase.js'

const app = new Hono()

// GET /products?limit=20&offset=0
app.get('/', async (c) => {
  const limit = Math.max(1, Math.min(100, Number(c.req.query('limit') ?? 20)))
  const offset = Math.max(0, Number(c.req.query('offset') ?? 0))
  const categoryName = c.req.query('category')

  // Base query
  let query: any = admin
    .from('products')
    .select('*', { count: 'exact' })

  // If a specific category name is provided (not ALL), translate to product IDs via join table
  if (categoryName && categoryName !== 'ALL') {
    // Find category id by name
    const { data: cat, error: catErr } = await admin
      .from('categories')
      .select('id')
      .ilike('category_name', categoryName)
      .maybeSingle()
    if (catErr) return c.json({ error: catErr.message }, 500)
    if (!cat) {
      // No such category -> empty result
      return c.json({ items: [], total: 0, limit, offset })
    }
    const categoryId = cat.id
    // Fetch product ids for that category
    const { data: links, error: linkErr } = await admin
      .from('product_categories')
      .select('product_id')
      .eq('category_id', categoryId)
    if (linkErr) return c.json({ error: linkErr.message }, 500)
    const ids = (links || []).map((r: any) => r.product_id)
    if (ids.length === 0) return c.json({ items: [], total: 0, limit, offset })
    query = query.in('id', ids)
  }

  const { data, error, count } = await query.range(offset, offset + limit - 1)
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
