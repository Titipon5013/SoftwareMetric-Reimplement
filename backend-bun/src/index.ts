import { Hono } from 'hono'
import { cors } from 'hono/cors'
import products from './routes/products.js'
import categories from './routes/categories.js'
import cart from './routes/cart.js'
import admin from './routes/admin.js'
import favorites from './routes/favorites.js'
import orders from './routes/orders.js'
import adminRoutes from './routes/admin.js'

const app = new Hono()

// CORS
const allowed = (Bun.env.ALLOWED_ORIGINS || '*')
  .split(',')
  .map((s: string) => s.trim())
app.use('*', cors({
  origin: (origin?: string) => (allowed.includes('*') ? '*' : (origin && allowed.includes(origin) ? origin : allowed[0] || '')),
  credentials: true,
}))

app.get('/health', (c) => c.json({ ok: true }))

app.route('/products', products)
app.route('/categories', categories)
app.route('/cart', cart)
app.route('/admin', admin)
app.route('/favorites', favorites)
app.route('/orders', orders)
app.route('/admin', adminRoutes)

const port = Number(Bun.env.PORT || 8787)
console.log(`[backend-bun] listening on http://localhost:${port}`)

Bun.serve({ port, fetch: app.fetch })
