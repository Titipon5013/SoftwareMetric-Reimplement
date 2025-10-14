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

  let q = sbAdmin.from('products').select('*')
  if (search && search.length > 0) {
    q = q.ilike('name', `%${search}%`)
  }
  const { data, error } = await q.order('id', { ascending: false }).range(offset, offset + limit - 1)
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ items: data })
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
  let q = sbAdmin.from('inventory').select('*').order('last_updated', { ascending: false })
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
  const { error } = await sbAdmin.from('orders').update({ status }).eq('id', Number(id))
  if (error) return c.json({ error: error.message }, 400)
  return c.json({ ok: true })
})

export default app
