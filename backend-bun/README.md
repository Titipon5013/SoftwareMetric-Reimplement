# backend-bun (Hono + Supabase)

## Run locally (Bun)

1. Copy `.env.example` to `.env` and fill values.
2. Start dev server with hot reload:

```powershell
bun --version
cd "d:\Software Metric\SoftwareMetric-Reimplement\backend-bun"
bun install
bun --hot run src/index.ts
```

Server listens on `http://localhost:8787` by default.

## Environment

- `SUPABASE_URL` — Your project URL
- `SUPABASE_SERVICE_ROLE_KEY` — Service role key (server only)
- `PORT` — Default 8787
- `ALLOWED_ORIGINS` — Comma-separated origins (e.g. `http://localhost:5173`)

## Routes

- `GET /health`
- `GET /products` `GET /products/:id` (public)
- `GET /categories` (public)
- `GET /cart` `POST /cart` `DELETE /cart/:id` (requires Authorization: Bearer <access_token>)

Cart requests forward the bearer token to Supabase so your RLS policies apply.

## Notes

- This backend is thin by design: most security relies on Supabase RLS.
- For admin actions (inventory, shipments), use the `admin` client with care and add your own auth.