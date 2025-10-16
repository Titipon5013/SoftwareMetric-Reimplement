import type { Context, Next } from 'hono'
import { createVerifier } from 'fast-jwt'

const secret = () => (Bun.env.ADMIN_JWT_SECRET || '').trim()

export async function adminAuth(c: Context, next: Next) {
  const header = c.req.header('authorization') || ''
  const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7) : ''
  if (!token) return c.json({ error: 'Unauthorized' }, 401)
  if (!secret()) return c.json({ error: 'Server misconfigured: missing ADMIN_JWT_SECRET' }, 500)

  try {
    const verify = createVerifier({ key: async () => secret() })
    const payload = await verify(token)
    // minimal check
    if (!payload || payload.role !== 'admin') return c.json({ error: 'Forbidden' }, 403)
    c.set('admin', { id: payload.sub, username: payload.username })
    await next()
  } catch (e) {
    return c.json({ error: 'Invalid token' }, 401)
  }
}
import { jwtVerify, SignJWT } from 'jose'
import type { MiddlewareHandler } from 'hono'

const SECRET = new TextEncoder().encode(Bun.env.ADMIN_JWT_SECRET || 'dev-secret')

export async function signAdminToken(payload: Record<string, unknown>) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET)
}

export const requireAdmin: MiddlewareHandler = async (c, next) => {
  const auth = c.req.header('authorization') || ''
  const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7) : ''
  if (!token) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const { payload } = await jwtVerify(token, SECRET)
    c.set('admin', payload)
    await next()
  } catch (e) {
    return c.json({ error: 'Invalid token' }, 401)
  }
}
