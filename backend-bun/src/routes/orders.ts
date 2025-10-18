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

// Auth middleware
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

// GET /orders - list own orders
app.get('/', async (c) => {
  const userId = c.get('userId')!
  const { data, error } = await sbAdmin
    .from('orders')
    .select('id, created_at, status, subtotal, tax_amount, shipping_cost, total_price')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) return c.json({ error: error.message }, 400)
  return c.json({ items: data })
})

// GET /orders/shipments - list shipments for the current user's orders
app.get('/shipments', async (c) => {
  const userId = c.get('userId')!
  // Join shipments -> orders to ensure access only to own shipments
  const { data, error } = await sbAdmin
    .from('shipments')
    .select('id, order_id, status, tracking_number, updated_at, orders!inner(user_id)')
    .eq('orders.user_id', userId)
    .order('updated_at', { ascending: false })
  if (error) return c.json({ error: error.message }, 400)
  // remove joined orders field before returning
  const items = (data || []).map((s: any) => ({ id: s.id, order_id: s.order_id, status: s.status, tracking_number: s.tracking_number, updated_at: s.updated_at }))
  return c.json({ items })
})

// GET /orders/:id - view own order detail + items (enrich items with product name/image)
app.get('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const userId = c.get('userId')!
  const { data: order, error } = await sbAdmin
    .from('orders')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single()
  if (error || !order) return c.json({ error: 'Not found' }, 404)

  const { data: items, error: itemsErr } = await sbAdmin
    .from('order_items')
    .select('id, product_id, quantity, price, size, color')
    .eq('order_id', id)
  if (itemsErr) return c.json({ error: itemsErr.message }, 400)

  const pids = Array.from(new Set((items || []).map((it: any) => it.product_id)))
  let productsById: Record<number, any> = {}
  if (pids.length) {
    const { data: prods } = await sbAdmin.from('products').select('id, name, image').in('id', pids)
    if (prods) productsById = prods.reduce((acc: any, p: any) => { acc[p.id] = p; return acc }, {})
  }
  const enriched = (items || []).map((it: any) => ({ ...it, product: productsById[it.product_id] || null }))
  return c.json({ order, items: enriched })
})

// POST /orders - create from current cart
app.post('/', async (c) => {
  try {
    const userId = c.get('userId')!
    const body = await c.req.json().catch(() => ({}))
    const fullname = body?.fullname ?? null
    const shipping_address = body?.shipping_address ?? null
    const payment_method = body?.payment_method ?? 'card'

    // Load cart
    const { data: cartRows, error: cartErr } = await sbAdmin
      .from('cart')
      .select('id, product_id, size, color, quantity')
      .eq('user_id', userId)
    if (cartErr) return c.json({ error: cartErr.message }, 400)
    if (!cartRows || cartRows.length === 0) return c.json({ error: 'Cart is empty' }, 400)

    // Fetch products for pricing
    const pids = Array.from(new Set(cartRows.map(r => r.product_id)))
    const { data: prods, error: pErr } = await sbAdmin
      .from('products')
      .select('id, price, promotion_price')
      .in('id', pids)
    if (pErr) return c.json({ error: pErr.message }, 400)
    const priceById: Record<number, number> = {}
    for (const p of prods || []) {
      priceById[p.id] = (p.promotion_price ?? p.price) as number
    }

    // Compute totals
    let subtotal = 0
    const items = cartRows.map((r) => {
      const price = priceById[r.product_id] ?? 0
      subtotal += price * r.quantity
      return {
        product_id: r.product_id,
        quantity: r.quantity,
        price,
        size: r.size,
        color: r.color,
      }
    })
    const taxRate = 0.06
    const shippingCost = 13
    const taxAmount = +(subtotal * taxRate).toFixed(2)
    const total = +(subtotal + shippingCost + taxAmount).toFixed(2)

    // Create order
    const { data: order, error: ordErr } = await sbAdmin
      .from('orders')
      .insert({ user_id: userId, fullname, shipping_address, payment_method, status: 'processing', subtotal, tax_amount: taxAmount, shipping_cost: shippingCost, total_price: total })
      .select('*')
      .single()
    if (ordErr) return c.json({ error: ordErr.message }, 400)

    // Insert order items
    const rows = items.map((it) => ({ order_id: order.id, ...it }))
    const { error: itemsErr } = await sbAdmin.from('order_items').insert(rows)
    if (itemsErr) return c.json({ error: itemsErr.message }, 400)

    // Clear cart
    await sbAdmin.from('cart').delete().eq('user_id', userId)

    return c.json({ ok: true, id: order.id, subtotal, taxAmount, shippingCost, total })
  } catch (e: any) {
    return c.json({ error: 'Invalid request' }, 400)
  }
})

export default app
