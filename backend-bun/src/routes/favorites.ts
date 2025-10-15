import { Hono } from 'hono'
import { admin as sbAdmin } from '../lib/supabase.js'
import { createVerifier } from 'fast-jwt'

const app = new Hono<{ Variables: { userId?: number } }>()

function getSecret() {
  const s = Bun.env.USER_JWT_SECRET || Bun.env.ADMIN_JWT_SECRET
  if (!s) throw new Error('USER_JWT_SECRET missing')
  return s
}
const verify = createVerifier({ key: async () => getSecret() })

// Auth middleware: verify our JWT and set userId
app.use('*', async (c, next) => {
  const auth = c.req.header('authorization') || ''
  if (!auth.toLowerCase().startsWith('bearer ')) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const payload: any = await verify(auth.slice(7))
    const userId = Number(payload.sub)
    if (!userId) return c.json({ error: 'Unauthorized' }, 401)
    c.set('userId', userId)
    await next()
  } catch {
    return c.json({ error: 'Unauthorized' }, 401)
  }
})

// GET /favorites - list user's favorites, enriched with product details
app.get('/', async (c) => {
  const userId = c.get('userId')!
  const { data: favs, error } = await sbAdmin
    .from('favorites')
    .select('id, product_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) return c.json({ error: error.message }, 400)

  const productIds = Array.from(new Set((favs || []).map(f => f.product_id))).filter(Boolean)
  let products: any[] = []
  if (productIds.length > 0) {
    const { data: prods, error: perr } = await sbAdmin
      .from('products')
      .select('id, name, image, price, promotion_price')
      .in('id', productIds)
    if (!perr && prods) products = prods
  }
  const map = new Map<number, any>(products.map(p => [p.id, p]))
  const items = (favs || []).map(f => ({
    ...f,
    name: map.get(f.product_id)?.name ?? null,
    image: map.get(f.product_id)?.image ?? null,
    price: map.get(f.product_id)?.price ?? null,
    promotion_price: map.get(f.product_id)?.promotion_price ?? null,
  }))
  return c.json({ items })
})

// POST /favorites { product_id }
app.post('/', async (c) => {
  try {
    const userId = c.get('userId')!
    const body = await c.req.json()
    if (!body?.product_id) return c.json({ error: 'product_id is required' }, 400)
    const { data, error } = await sbAdmin
      .from('favorites')
      .insert({ user_id: userId, product_id: body.product_id })
      .select('*')
      .single()
    if (error) return c.json({ error: error.message }, 400)
    return c.json(data, 201)
  } catch {
    return c.json({ error: 'Invalid request' }, 400)
  }
})

// DELETE /favorites/:id - only user's record
app.delete('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const userId = c.get('userId')!
  const { error } = await sbAdmin.from('favorites').delete().eq('id', id).eq('user_id', userId)
  if (error) return c.json({ error: error.message }, 400)
  return c.json({ ok: true })
})

export default app
