import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = Bun.env.SUPABASE_URL as string
const SERVICE_ROLE = Bun.env.SUPABASE_SERVICE_ROLE_KEY as string
const ANON_KEY = Bun.env.SUPABASE_ANON_KEY as string

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment')
}

export const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
})

// Create a request-scoped client that forwards the user's bearer token
export function supabaseFromRequest(req: Request) {
  const authHeader = req.headers.get('authorization') || ''
  const accessToken = authHeader.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7)
    : undefined

  // Use anon key so RLS policies apply; forward user's access token to PostgREST
  return createClient(SUPABASE_URL, ANON_KEY, {
    global: {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    },
    auth: { persistSession: false },
  })
}
