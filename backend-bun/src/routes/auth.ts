import { Hono } from 'hono'
import { createSigner, createVerifier } from 'fast-jwt'
import bcrypt from 'bcryptjs'
import { admin as sbAdmin } from '../lib/supabase.js'

type UserSafe = {
  id: number
  name: string
  email: string
  address?: string | null
  phone?: string | null
  created_at?: string
}

function getUserSecret() {
  const s = Bun.env.USER_JWT_SECRET
  if (!s) throw new Error('USER_JWT_SECRET missing')
  return s
}
function getAdminSecret() {
  const s = Bun.env.ADMIN_JWT_SECRET
  if (!s) throw new Error('ADMIN_JWT_SECRET missing')
  return s
}

// fast-jwt expects key callback returning string or Buffer. Use the raw secret string.
const userSign = createSigner({ key: async () => getUserSecret(), expiresIn: '24h' })
const adminSign = createSigner({ key: async () => getAdminSecret(), expiresIn: '12h' })
const verifyUser = createVerifier({ key: async () => getUserSecret() })

const app = new Hono<{ Variables: { user?: UserSafe } }>()

function toSafe(u: any): UserSafe {
  const { id, name, email, address, phone, created_at } = u
  return { id, name, email, address, phone, created_at }
}

// POST /auth/signup { name, email, password }
app.post('/signup', async (c) => {
  try {
    let body: any
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: 'Invalid JSON body' }, 400)
    }
    const { name, email, password } = body || {}
    if (!name || !email || !password) return c.json({ error: 'name, email, password required' }, 400)
    const emailLower = String(email).trim().toLowerCase()

    const { data: existing, error: exErr } = await sbAdmin.from('users').select('id').eq('email', emailLower).maybeSingle()
    if (exErr) return c.json({ error: exErr.message }, 400)
    if (existing) return c.json({ error: 'Email already registered' }, 409)

    const hash = await bcrypt.hash(password, 10)
    const { data, error } = await sbAdmin
      .from('users')
      .insert({ name, email: emailLower, password: hash })
      .select('*')
      .single()
    if (error || !data) return c.json({ error: error?.message || 'Signup failed' }, 400)
  const token = await userSign({ sub: String(data.id), email: data.email, name: data.name, role: 'user' })
  return c.json({ token, user: toSafe(data), role: 'user' }, 201)
  } catch (e: any) {
    console.error('signup error', e)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// POST /auth/login { identifier, password } (identifier can be email or name)
app.post('/login', async (c) => {
  try {
    let body: any
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: 'Invalid JSON body' }, 400)
    }
    const { identifier, password } = body || {}
    if (!identifier || !password) return c.json({ error: 'identifier and password required' }, 400)
    const ident = String(identifier).trim()
    const isEmail = ident.includes('@')
    // 1) Try normal users table
    let q = sbAdmin.from('users').select('*')
    q = isEmail ? q.eq('email', ident.toLowerCase()) : q.eq('name', ident)
    const { data: user, error } = await q.maybeSingle()
    if (user && !error) {
      let ok = false
      try {
        ok = await bcrypt.compare(password, (user as any).password)
      } catch {
        ok = false
      }
      if (!ok && (Bun.env.ALLOW_PLAINTEXT_USER_PASSWORD === 'true')) {
        ok = password === String((user as any).password)
      }
      if (!ok) return c.json({ error: 'Invalid credentials' }, 401)
      const token = await userSign({ sub: String(user.id), email: user.email, name: user.name, role: 'user' })
      return c.json({ token, user: toSafe(user), role: 'user' })
    }

    // 2) Fallback to admin_users by username
    const { data: adminUser, error: adminErr } = await sbAdmin
      .from('admin_users')
      .select('id, username, password')
      .eq('username', ident)
      .maybeSingle()
    if (adminUser && !adminErr) {
      let ok = false
      try {
        ok = await bcrypt.compare(password, (adminUser as any).password)
      } catch {
        ok = false
      }
      if (!ok && (Bun.env.ALLOW_PLAINTEXT_ADMIN_PASSWORD === 'true')) {
        ok = password === String((adminUser as any).password)
      }
      if (!ok) return c.json({ error: 'Invalid credentials' }, 401)
      const token = await adminSign({ sub: String(adminUser.id), username: (adminUser as any).username, role: 'admin' })
      // Return a user-like shape for compatibility, plus role
      const pseudoUser: UserSafe = { id: Number(adminUser.id), name: (adminUser as any).username, email: '', address: null, phone: null }
      return c.json({ token, user: pseudoUser, role: 'admin' })
    }

    return c.json({ error: 'Invalid credentials' }, 401)
  } catch (e: any) {
    console.error('login error', e)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Middleware to authenticate user
app.use('/me/*', async (c, next) => {
  const auth = c.req.header('authorization') || ''
  if (!auth.toLowerCase().startsWith('bearer ')) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const payload: any = await verifyUser(auth.slice(7))
    const userId = Number(payload.sub)
    const { data: user, error } = await sbAdmin.from('users').select('*').eq('id', userId).single()
    if (error || !user) return c.json({ error: 'Unauthorized' }, 401)
    c.set('user', toSafe(user))
    await next()
  } catch {
    return c.json({ error: 'Unauthorized' }, 401)
  }
})

// GET /auth/me/info
app.get('/me/info', (c) => {
  return c.json({ user: c.get('user') })
})

// PATCH /auth/me/profile { name?, address?, phone? }
app.patch('/me/profile', async (c) => {
  try {
    const current = c.get('user')
    if (!current) return c.json({ error: 'Unauthorized' }, 401)
    let body: any = {}
    try { body = await c.req.json() } catch {/* empty allowed */}
    const update: Record<string, any> = {}
    for (const k of ['name', 'address', 'phone']) {
      if (body[k] !== undefined) update[k] = body[k]
    }
    if (Object.keys(update).length === 0) return c.json({ user: current })
    const { data, error } = await sbAdmin
      .from('users')
      .update(update)
      .eq('id', current.id)
      .select('*')
      .single()
    if (error || !data) return c.json({ error: error?.message || 'Update failed' }, 400)
    return c.json({ user: toSafe(data) })
  } catch (e: any) {
    console.error('profile update error', e)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

export default app