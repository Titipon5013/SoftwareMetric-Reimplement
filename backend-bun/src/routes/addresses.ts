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

// GET /addresses - list addresses for user
app.get('/', async (c) => {
  const userId = c.get('userId')!
  const { data, error } = await sbAdmin
    .from('addresses')
    .select('id, label, recipient, line1, line2, city, state, postal_code, country, phone, is_default, created_at')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) return c.json({ error: error.message }, 400)
  return c.json({ items: data })
})

// POST /addresses - create new address
app.post('/', async (c) => {
  try {
    const userId = c.get('userId')!
    const body = await c.req.json()
    const payload = {
      user_id: userId,
      label: body.label ?? null,
      recipient: body.recipient ?? null,
      line1: body.line1 ?? null,
      line2: body.line2 ?? null,
      city: body.city ?? null,
      state: body.state ?? null,
      postal_code: body.postal_code ?? null,
      country: body.country ?? null,
      phone: body.phone ?? null,
      is_default: !!body.is_default,
    }
    if (payload.is_default) {
      await sbAdmin.from('addresses').update({ is_default: false }).eq('user_id', userId)
    }
    const { data, error } = await sbAdmin.from('addresses').insert(payload).select('*').single()
    if (error) return c.json({ error: error.message }, 400)
    return c.json(data, 201)
  } catch (e: any) {
    return c.json({ error: 'Invalid request' }, 400)
  }
})

// PATCH /addresses/:id - update
app.patch('/:id', async (c) => {
  try {
    const id = Number(c.req.param('id'))
    const userId = c.get('userId')!
    const body = await c.req.json()
    const patch: any = {}
    for (const k of ['label','recipient','line1','line2','city','state','postal_code','country','phone']) {
      if (k in body) patch[k] = body[k]
    }
    if ('is_default' in body) patch.is_default = !!body.is_default
    if (patch.is_default === true) {
      await sbAdmin.from('addresses').update({ is_default: false }).eq('user_id', userId)
    }
    const { error } = await sbAdmin.from('addresses').update(patch).eq('id', id).eq('user_id', userId)
    if (error) return c.json({ error: error.message }, 400)
    return c.json({ ok: true })
  } catch (e: any) {
    return c.json({ error: 'Invalid request' }, 400)
  }
})

// DELETE /addresses/:id - remove
app.delete('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const userId = c.get('userId')!
  const { error } = await sbAdmin.from('addresses').delete().eq('id', id).eq('user_id', userId)
  if (error) return c.json({ error: error.message }, 400)
  return c.json({ ok: true })
})

// POST /addresses/:id/default - set as default
app.post('/:id/default', async (c) => {
  const id = Number(c.req.param('id'))
  const userId = c.get('userId')!
  await sbAdmin.from('addresses').update({ is_default: false }).eq('user_id', userId)
  const { error } = await sbAdmin.from('addresses').update({ is_default: true }).eq('id', id).eq('user_id', userId)
  if (error) return c.json({ error: error.message }, 400)
  return c.json({ ok: true })
})

export default app