import { Hono } from 'hono'
import { admin as sbAdmin } from '../lib/supabase.js'
import { adminAuth } from '../middleware/adminAuth.js'
import { createSigner } from 'fast-jwt'
import bcrypt from 'bcryptjs'

type AdminBindings = {
  Variables: {
    admin: { id: string; username: string }
  }
}

const app = new Hono<AdminBindings>()

function getSecret() {
  const s = Bun.env.ADMIN_JWT_SECRET
  if (!s) throw new Error('ADMIN_JWT_SECRET is required')
  return s
}

// POST /admin/login { username, password }
app.post('/login', async (c) => {
  const { username, password } = await c.req.json()
  if (!username || !password) return c.json({ error: 'username and password required' }, 400)

  const { data, error } = await sbAdmin
    .from('admin_users')
    .select('id, username, password')
    .eq('username', username)
    .single()
  if (error || !data) return c.json({ error: 'Invalid credentials' }, 401)

  const ok = await bcrypt.compare(password, data.password)
  if (!ok) return c.json({ error: 'Invalid credentials' }, 401)

  const sign = createSigner({ key: async () => new TextEncoder().encode(getSecret()), expiresIn: '12h' })
  const token = await sign({ sub: String(data.id), username: data.username, role: 'admin' })
  return c.json({ token })
})

// All routes below require admin auth
app.use('*', adminAuth)

// GET /admin/me
app.get('/me', (c) => {
  const me = c.get('admin')
  return c.json({ me })
})

// Categories CRUD
app.get('/categories', async (c) => {
  const { data, error } = await sbAdmin.from('categories').select('*').order('category_name')
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ items: data })
})

app.post('/categories', async (c) => {
  const body = await c.req.json()
  const { data, error } = await sbAdmin.from('categories').insert(body).select('*').single()
  if (error) return c.json({ error: error.message }, 400)
  return c.json(data, 201)
})

app.patch('/categories/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const body = await c.req.json()
  const { data, error } = await sbAdmin.from('categories').update(body).eq('id', id).select('*').single()
  if (error) return c.json({ error: error.message }, 400)
  return c.json(data)
})

app.delete('/categories/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const { error } = await sbAdmin.from('categories').delete().eq('id', id)
  if (error) return c.json({ error: error.message }, 400)
  return c.json({ ok: true })
})

// Products CRUD
app.get('/products', async (c) => {
  const limit = Number(c.req.query('limit') ?? 20)
  const offset = Number(c.req.query('offset') ?? 0)
  const search = c.req.query('search')?.trim()

  let q = sbAdmin.from('products').select('*', { count: 'exact' })
  if (search && search.length > 0) {
    q = q.ilike('name', `%${search}%`)
  }
  const { data, error, count } = await (q as any).order('id', { ascending: false }).range(offset, offset + limit - 1)
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ items: data, total: count ?? 0, limit, offset })
})

app.get('/products/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const { data: product, error } = await sbAdmin.from('products').select('*').eq('id', id).single()
  if (error || !product) return c.json({ error: 'Not found' }, 404)

  const { data: cats } = await sbAdmin
    .from('product_categories')
    .select('category_id')
    .eq('product_id', id)
  const category_ids = (cats || []).map((r: any) => r.category_id)

  const { data: inventory } = await sbAdmin
    .from('inventory')
    .select('*')
    .eq('product_id', id)

  return c.json({ product, category_ids, inventory })
})

app.post('/products', async (c) => {
  const body = await c.req.json()
  const { name, price, promotion_price, image, description, size, colors, category_ids } = body
  const { data, error } = await sbAdmin
    .from('products')
    .insert({ name, price, promotion_price, image, description, size, colors })
    .select('*')
    .single()
  if (error) return c.json({ error: error.message }, 400)
  const productId = data.id
  if (Array.isArray(category_ids) && category_ids.length > 0) {
    const rows = category_ids.map((cid: number) => ({ product_id: productId, category_id: cid }))
    const { error: linkErr } = await sbAdmin.from('product_categories').insert(rows)
    if (linkErr) return c.json({ error: linkErr.message }, 400)
  }
  return c.json({ ok: true, id: productId })
})

app.patch('/products/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const body = await c.req.json()
  const { name, price, promotion_price, image, description, size, colors, category_ids } = body

  // Build partial update only for defined fields
  const update: Record<string, any> = {}
  for (const [k, v] of Object.entries({ name, price, promotion_price, image, description, size, colors })) {
    if (v !== undefined) update[k] = v
  }

  if (Object.keys(update).length > 0) {
    const { error } = await sbAdmin.from('products').update(update).eq('id', id)
    if (error) return c.json({ error: error.message }, 400)
  }

  if (Array.isArray(category_ids)) {
    // reset categories to provided list
    await sbAdmin.from('product_categories').delete().eq('product_id', id)
    if (category_ids.length > 0) {
      const rows = category_ids.map((cid: number) => ({ product_id: id, category_id: cid }))
      const { error: linkErr } = await sbAdmin.from('product_categories').insert(rows)
      if (linkErr) return c.json({ error: linkErr.message }, 400)
    }
  }

  return c.json({ ok: true })
})

app.delete('/products/:id', async (c) => {
  const id = Number(c.req.param('id'))
  // delete related
  await sbAdmin.from('product_categories').delete().eq('product_id', id)
  await sbAdmin.from('inventory').delete().eq('product_id', id)
  const { error } = await sbAdmin.from('products').delete().eq('id', id)
  if (error) return c.json({ error: error.message }, 400)
  return c.json({ ok: true })
})

// Inventory endpoints
app.get('/inventory', async (c) => {
  const productId = c.req.query('product_id')
  // Order primarily by updated_at if present, else last_updated for backward compatibility
  let q = sbAdmin.from('inventory').select('*').order('updated_at', { ascending: false, nullsFirst: false }).order('last_updated', { ascending: false })
  if (productId) {
    q = q.eq('product_id', Number(productId))
  }
  const { data, error } = await q
  if (error) return c.json({ error: error.message }, 400)
  return c.json({ items: data })
})

// Upsert inventory by (product_id, color, size)
app.post('/inventory', async (c) => {
  const body = await c.req.json()
  const { product_id, color, size, stock } = body
  const { data, error } = await sbAdmin
    .from('inventory')
    .upsert({ product_id, color, size, stock }, { onConflict: 'product_id,color,size' })
    .select('*')
    .single()
  if (error) return c.json({ error: error.message }, 400)
  return c.json(data)
})

app.patch('/inventory/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const body = await c.req.json()
  const update: Record<string, any> = {}
  for (const [k, v] of Object.entries({ color: body.color, size: body.size, stock: body.stock })) {
    if (v !== undefined) update[k] = v
  }
  const { data, error } = await sbAdmin.from('inventory').update(update).eq('id', id).select('*').single()
  if (error) return c.json({ error: error.message }, 400)
  return c.json(data)
})

app.delete('/inventory/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const { error } = await sbAdmin.from('inventory').delete().eq('id', id)
  if (error) return c.json({ error: error.message }, 400)
  return c.json({ ok: true })
})

// Shipments endpoints
app.get('/shipments', async (c) => {
  const status = c.req.query('status')
  const orderId = c.req.query('order_id')
  let q = sbAdmin.from('shipments').select('*').order('updated_at', { ascending: false })
  if (status) q = q.eq('status', status)
  if (orderId) q = q.eq('order_id', Number(orderId))
  const { data, error } = await q
  if (error) return c.json({ error: error.message }, 400)
  return c.json({ items: data })
})

app.patch('/shipments/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const body = await c.req.json()
  const update: Record<string, any> = {}
  for (const [k, v] of Object.entries({ status: body.status, tracking_number: body.tracking_number })) {
    if (v !== undefined) update[k] = v
  }
  const { data, error } = await sbAdmin.from('shipments').update(update).eq('id', id).select('*').single()
  if (error) return c.json({ error: error.message }, 400)
  return c.json(data)
})

// Customers endpoints (public.users as customers)
app.get('/customers', async (c) => {
  const limit = Number(c.req.query('limit') ?? 20)
  const offset = Number(c.req.query('offset') ?? 0)
  const search = c.req.query('search')?.trim()
  let q = sbAdmin.from('users').select('id, name, email, address, phone, created_at')
  if (search && search.length > 0) {
    q = q.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
  }
  const { data, error } = await q.order('id', { ascending: false }).range(offset, offset + limit - 1)
  if (error) return c.json({ error: error.message }, 400)
  return c.json({ items: data })
})

app.post('/customers', async (c) => {
  const { name, email, password, address, phone } = await c.req.json()
  const { data, error } = await sbAdmin
    .from('users')
    .insert({ name, email, password, address, phone })
    .select('id, name, email, address, phone, created_at')
    .single()
  if (error) return c.json({ error: error.message }, 400)
  return c.json(data, 201)
})

app.patch('/customers/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const body = await c.req.json()
  const update: Record<string, any> = {}
  for (const [k, v] of Object.entries({ name: body.name, email: body.email, password: body.password, address: body.address, phone: body.phone })) {
    if (v !== undefined) update[k] = v
  }
  const { data, error } = await sbAdmin
    .from('users')
    .update(update)
    .eq('id', id)
    .select('id, name, email, address, phone, created_at')
    .single()
  if (error) return c.json({ error: error.message }, 400)
  return c.json(data)
})

app.delete('/customers/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const { error } = await sbAdmin.from('users').delete().eq('id', id)
  if (error) return c.json({ error: error.message }, 400)
  return c.json({ ok: true })
})

// Orders endpoints
app.get('/orders', async (c) => {
  const limit = Number(c.req.query('limit') ?? 20)
  const offset = Number(c.req.query('offset') ?? 0)
  const status = c.req.query('status')?.trim()
  let q = sbAdmin.from('orders').select('*')
  if (status) q = q.eq('status', status)
  const { data, error } = await q.order('id', { ascending: false }).range(offset, offset + limit - 1)
  if (error) return c.json({ error: error.message }, 400)
  return c.json({ items: data })
})

app.get('/orders/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const { data: order, error } = await sbAdmin.from('orders').select('*').eq('id', id).single()
  if (error || !order) return c.json({ error: 'Not found' }, 404)
  const { data: items } = await sbAdmin
    .from('order_items')
    .select('id, product_id, quantity, price, size, color')
    .eq('order_id', id)
  return c.json({ order, items })
})

// Create order with optional items[]
app.post('/orders', async (c) => {
  const body = await c.req.json()
  const { user_id, fullname, shipping_address, payment_method, status, subtotal, tax_amount, shipping_cost, total_price, items } = body
  const { data: order, error } = await sbAdmin
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
    const { error: itemsErr } = await sbAdmin.from('order_items').insert(rows)
    if (itemsErr) return c.json({ error: itemsErr.message }, 400)
  }
  return c.json({ ok: true, id: order.id })
})

app.patch('/orders/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const body = await c.req.json()
  const update: Record<string, any> = {}
  for (const [k, v] of Object.entries({
    user_id: body.user_id,
    fullname: body.fullname,
    shipping_address: body.shipping_address,
    payment_method: body.payment_method,
    status: body.status,
    subtotal: body.subtotal,
    tax_amount: body.tax_amount,
    shipping_cost: body.shipping_cost,
    total_price: body.total_price,
  })) {
    if (v !== undefined) update[k] = v
  }
  const { error } = await sbAdmin.from('orders').update(update).eq('id', id)
  if (error) return c.json({ error: error.message }, 400)
  return c.json({ ok: true })
})

app.delete('/orders/:id', async (c) => {
  const id = Number(c.req.param('id'))
  // order_items has ON DELETE CASCADE, but ensure cleanup if needed
  await sbAdmin.from('order_items').delete().eq('order_id', id)
  const { error } = await sbAdmin.from('orders').delete().eq('id', id)
  if (error) return c.json({ error: error.message }, 400)
  return c.json({ ok: true })
})

// Convenience: update order status like old /admin/orders/update-status
app.post('/orders/update-status', async (c) => {
  const { id, status } = await c.req.json()
  const orderId = Number(id)
  const DEBUG = (Bun.env.DEBUG_ORDER_STOCK ?? 'true') !== 'false'
  const dbg = (...args: any[]) => { if (DEBUG) console.log('[admin:orders:update-status]', ...args) }

  dbg('request', { orderId, status })
  // Load previous status to ensure we only process side effects once
  const { data: prevOrder } = await sbAdmin
    .from('orders')
    .select('status')
    .eq('id', orderId)
    .single()
  dbg('prevStatus', prevOrder?.status)

  const { error } = await sbAdmin.from('orders').update({ status }).eq('id', orderId)
  if (error) {
    dbg('update order status failed', error.message)
    return c.json({ error: error.message }, 400)
  }

  if (status === 'success' && prevOrder && prevOrder.status !== 'success') {
    dbg('processing success side-effects for order', orderId)
    // Ensure there's at least one shipment; create as pending with a tracking placeholder
    const { data: existingShip } = await sbAdmin
      .from('shipments')
      .select('id')
      .eq('order_id', orderId)
      .maybeSingle()

    if (!existingShip) {
      const tracking = `TRK-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`
      const { error: shipErr } = await sbAdmin.from('shipments').insert({ order_id: orderId, tracking_number: tracking, status: 'pending' })
      if (shipErr) dbg('create shipment error', shipErr.message)
      else dbg('shipment created', { orderId, tracking })
    }

    // Decrement inventory per order item
    const { data: items, error: itemsLoadErr } = await sbAdmin
      .from('order_items')
      .select('product_id, quantity, size, color')
      .eq('order_id', orderId)
    if (itemsLoadErr) dbg('load order_items error', itemsLoadErr.message)
    if (Array.isArray(items)) {
      for (const it of items) {
        const qty = Math.max(1, Number(it.quantity || 1))
        dbg('item', { product_id: it.product_id, color: it.color, size: it.size, qty })
        // Try exact variant match first, handling null color/size
        let q = sbAdmin
          .from('inventory')
          .select('id, stock')
          .eq('product_id', it.product_id) as any
        if (it.color == null || String(it.color).trim() === '') q = q.is('color', null)
        else q = q.ilike('color', String(it.color).trim())
        if (it.size == null || String(it.size).trim() === '') q = q.is('size', null)
        else q = q.ilike('size', String(it.size).trim())
        const { data: invExact, error: invExactErr } = await q.maybeSingle()
        if (invExactErr) dbg('invExact query error', invExactErr.message)
        if (invExact) {
          const newStock = Math.max(0, Number(invExact.stock || 0) - qty)
          const { error: upErr } = await sbAdmin
            .from('inventory')
            .update({ stock: newStock, last_updated: new Date().toISOString() })
            .eq('id', invExact.id)
          if (upErr) dbg('invExact update error', upErr.message)
          else dbg('invExact updated', { id: invExact.id, from: invExact.stock, to: newStock })
          continue
        }
        // Fallback: decrement any inventory row for this product if variant not found
        const { data: invAny, error: invAnyErr } = await sbAdmin
          .from('inventory')
          .select('id, stock')
          .eq('product_id', it.product_id)
          .order('stock', { ascending: false })
          .limit(1)
          .maybeSingle()
        if (invAnyErr) dbg('invAny query error', invAnyErr.message)
        if (invAny) {
          const newStock = Math.max(0, Number(invAny.stock || 0) - qty)
          const { error: upAnyErr } = await sbAdmin
            .from('inventory')
            .update({ stock: newStock, last_updated: new Date().toISOString() })
            .eq('id', invAny.id)
          if (upAnyErr) dbg('invAny update error', upAnyErr.message)
          else dbg('invAny updated', { id: invAny.id, from: invAny.stock, to: newStock })
        } else {
          dbg('no inventory row found for product', it.product_id)
        }
      }
    }
  }

  return c.json({ ok: true })
})

export default app

// Metrics endpoint: total orders, best sellers, top spenders
app.get('/metrics', async (c) => {
  try {
    // 1) Total orders
    const { count: totalOrders, error: countErr } = await sbAdmin
      .from('orders')
      .select('*', { count: 'exact', head: true })
    if (countErr) return c.json({ error: countErr.message }, 400)

    // 2) Best sellers (top 5 by quantity)
    const { data: orderItems, error: itemsErr } = await sbAdmin
      .from('order_items')
      .select('product_id, quantity, price')
    if (itemsErr) return c.json({ error: itemsErr.message }, 400)

    const byProduct: Record<number, { qty: number; revenue: number }> = {}
    for (const it of orderItems || []) {
      const pid = Number((it as any).product_id)
      const qty = Number((it as any).quantity || 0)
      const price = Number((it as any).price || 0)
      if (!byProduct[pid]) byProduct[pid] = { qty: 0, revenue: 0 }
      byProduct[pid].qty += qty
      byProduct[pid].revenue += qty * price
    }
    const topProdEntries = Object.entries(byProduct)
      .map(([pid, v]) => ({ product_id: Number(pid), ...v }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5)
    let bestSellers: any[] = []
    if (topProdEntries.length) {
      const pids = topProdEntries.map(p => p.product_id)
      const { data: prods } = await sbAdmin
        .from('products')
        .select('id, name, image')
        .in('id', pids)
      const map: Record<number, any> = {}
      for (const p of prods || []) map[(p as any).id] = p
      bestSellers = topProdEntries.map(e => ({
        product: map[e.product_id] || { id: e.product_id },
        total_qty: e.qty,
        total_revenue: +e.revenue.toFixed(2),
      }))
    }

    // 3) Top spenders (top 5 by total_spent)
    const { data: ordersLite, error: ordersErr } = await sbAdmin
      .from('orders')
      .select('user_id, total_price')
    if (ordersErr) return c.json({ error: ordersErr.message }, 400)

    const byUser: Record<number, { spent: number; count: number }> = {}
    for (const o of ordersLite || []) {
      const uid = Number((o as any).user_id)
      const total = Number((o as any).total_price || 0)
      if (!byUser[uid]) byUser[uid] = { spent: 0, count: 0 }
      byUser[uid].spent += total
      byUser[uid].count += 1
    }
    const topUserEntries = Object.entries(byUser)
      .map(([uid, v]) => ({ user_id: Number(uid), ...v }))
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 5)
    let topSpenders: any[] = []
    if (topUserEntries.length) {
      const uids = topUserEntries.map(u => u.user_id)
      const { data: users } = await sbAdmin
        .from('users')
        .select('id, name, email')
        .in('id', uids)
      const umap: Record<number, any> = {}
      for (const u of users || []) umap[(u as any).id] = u
      topSpenders = topUserEntries.map(e => ({
        user: umap[e.user_id] || { id: e.user_id },
        total_spent: +e.spent.toFixed(2),
        orders_count: e.count,
      }))
    }

    return c.json({
      total_orders: totalOrders ?? 0,
      best_sellers: bestSellers,
      top_spenders: topSpenders,
    })
  } catch (e: any) {
    return c.json({ error: 'Failed to compute metrics' }, 500)
  }
})
