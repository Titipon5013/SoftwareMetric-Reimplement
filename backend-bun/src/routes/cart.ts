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

// Auth middleware: verify our own JWT and set userId
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

// GET /cart - list current user's cart items via RLS
app.get('/', async (c) => {
  const userId = c.get('userId')!
  const { data: cartRows, error } = await sbAdmin
    .from('cart')
    .select('id, product_id, size, color, quantity')
    .eq('user_id', userId)
    .order('id', { ascending: false })
  if (error) return c.json({ error: error.message }, 400)

  // Enrich with basic product details
  const productIds = Array.from(new Set((cartRows || []).map((r) => r.product_id)))
  let productsById: Record<number, any> = {}
  if (productIds.length > 0) {
    const { data: prods, error: pErr } = await sbAdmin
      .from('products')
      .select('id, name, image, price, promotion_price')
      .in('id', productIds)
    if (!pErr && prods) {
      productsById = prods.reduce((acc: any, p: any) => { acc[p.id] = p; return acc }, {})
    }
  }

  const items = (cartRows || []).map((r) => ({
    ...r,
    product: productsById[r.product_id] || null,
  }))
  return c.json({ items })
})

// POST /cart - add to cart { product_id, size, color, quantity }
app.post('/', async (c) => {
  try {
    const userId = c.get('userId')!
    const body = await c.req.json()
    const { product_id, size, color } = body
    let { quantity } = body
    if (!product_id || !quantity) return c.json({ error: 'product_id and quantity required' }, 400)
    if (quantity < 1) quantity = 1

    // Inventory check via service role
    let invQuery = sbAdmin.from('inventory').select('id, stock').eq('product_id', product_id)
    if (size) invQuery = invQuery.eq('size', size)
    if (color) invQuery = invQuery.eq('color', color)
    const { data: invRows, error: invErr } = await invQuery.limit(1)
    if (invErr) return c.json({ error: invErr.message }, 400)
    // If no inventory row matched, treat as out of stock
    if (!invRows || invRows.length === 0) {
      return c.json({ error: 'Out of stock' }, 409)
    }
    const inv = invRows[0]
    if (inv.stock <= 0) return c.json({ error: 'Out of stock' }, 409)
    if (quantity > inv.stock) quantity = inv.stock

    const payload = { user_id: userId, product_id, size: size || null, color: color || null, quantity }
    const { data, error } = await sbAdmin.from('cart').insert(payload).select('*').single()
    if (error) return c.json({ error: error.message }, 400)
    return c.json(data, 201)
  } catch (e: any) {
    return c.json({ error: 'Invalid request' }, 400)
  }
})

// DELETE /cart/:id - remove own cart item
app.delete('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const userId = c.get('userId')!
  const { error } = await sbAdmin.from('cart').delete().eq('id', id).eq('user_id', userId)
  if (error) return c.json({ error: error.message }, 400)
  return c.json({ ok: true })
})

// PATCH /cart/:id - update quantity (validates inventory)
app.patch('/:id', async (c) => {
  try {
    const id = Number(c.req.param('id'))
    const userId = c.get('userId')!
    const body = await c.req.json()
    let qty = Number(body?.quantity)
    if (!qty || qty < 1) qty = 1

    // Load the cart row to access product and variant
    const { data: cartRow, error: cartErr } = await sbAdmin
      .from('cart')
      .select('id, product_id, size, color')
      .eq('id', id)
      .eq('user_id', userId)
      .single()
    if (cartErr || !cartRow) return c.json({ error: 'Not found' }, 404)

    // Validate inventory for the variant
    let invQuery = sbAdmin.from('inventory').select('id, stock').eq('product_id', cartRow.product_id)
    if (cartRow.size) invQuery = invQuery.eq('size', cartRow.size)
    if (cartRow.color) invQuery = invQuery.eq('color', cartRow.color)
    const { data: invRows, error: invErr } = await invQuery.limit(1)
    if (invErr) return c.json({ error: invErr.message }, 400)
    if (!invRows || invRows.length === 0) return c.json({ error: 'Out of stock' }, 409)
    const inv = invRows[0]
    if (inv.stock <= 0) return c.json({ error: 'Out of stock' }, 409)
    if (qty > inv.stock) qty = inv.stock

    const { error: updErr } = await sbAdmin.from('cart').update({ quantity: qty }).eq('id', id).eq('user_id', userId)
    if (updErr) return c.json({ error: updErr.message }, 400)
    return c.json({ ok: true, quantity: qty })
  } catch (e: any) {
    return c.json({ error: 'Invalid request' }, 400)
  }
})

export default app
