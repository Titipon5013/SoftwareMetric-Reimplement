import { Hono } from 'hono'
import { admin } from '../lib/supabase.js'

const app = new Hono()

app.get('/', async (c) => {
  const { data, error } = await admin.from('categories').select('*').order('category_name')
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ items: data })
})

export default app
