# SoftwareMetric-Reimplement

Full‑stack store rebuilt with:
- Frontend: Vue 3 + Vite + TypeScript, Pinia, Vue Router, Tailwind CSS v4
- Backend: Bun + Hono + Supabase (Postgres)

This README covers local development for both backend and frontend.

## Prerequisites

- Node.js 18+ and npm
- Bun 1.1+ (backend)
- Supabase project (URL + keys)

Optional:
- VS Code + Volar + ESLint extensions

## Environment variables

Create `backend-bun/.env` (or set in your shell) with:

```
SUPABASE_URL=...                # e.g. https://xxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...   # service role key (server only)
SUPABASE_ANON_KEY=...           # anon key (for request-scoped clients)

# JWT secrets
USER_JWT_SECRET=dev-user-secret
ADMIN_JWT_SECRET=dev-admin-secret

# CORS
ALLOWED_ORIGINS=http://localhost:5173

# Optional
PORT=8787
```

Tip (Windows PowerShell): you can create a file `backend-bun/.env` and Bun will load it automatically when using `bun --env-file` or via tools already configured. If not auto‑loaded, export variables in your terminal session before starting the backend.

## Backend (Bun + Hono)

Location: `backend-bun`

Install and run:

```powershell
cd backend-bun
bun install
bun src/index.ts
```

The server listens on `http://localhost:8787`.

Health check:

```powershell
Invoke-RestMethod 'http://localhost:8787/health'
```

Key endpoints (public):
- GET `/products?limit=20&offset=0&category=Kids` – paginated products, optional category filter
- GET `/products/:id` – product details (+inventory variants)
- GET `/categories` – list categories
- Auth, cart, orders, favorites also exist under their respective routes

Admin endpoints:
- POST `/admin/login` – get admin JWT
- CRUD for categories, products, inventory, shipments, customers
- POST `/admin/orders/update-status` – side effects for success orders (shipment + inventory decrement)
- GET `/admin/metrics` – totals, best sellers, top spenders

Admin login seed
- Insert an admin user in Supabase table `admin_users` with a bcrypt password (frontend provides UI; if seeding manually ensure hashing matches bcrypt). If you need a quick dev user, you can hash via Node/bcryptjs or temporarily allow a known hash.

Inventory updated_at
- If you see a trigger error like `record "new" has no field "updated_at"`, add an `updated_at` column and trigger on `inventory` in Supabase. The code prefers `updated_at` for ordering.

## Frontend (Vite + Vue 3)

Location: `frontend`

Install and run:

```powershell
cd frontend
npm install
npm run dev
```

Default dev URL: `http://localhost:5173`

Config:
- `VITE_API_BASE_URL` is optional; defaults to `http://localhost:8787`. To set explicitly, create `frontend/.env.local`:

```
VITE_API_BASE_URL=http://localhost:8787
```

### Features

- Product listing with search, sort, and server‑side pagination
- Category filter
	- Home quick links link to `/products?category=...`
	- Products page hydrates category from URL and updates the URL when changed
- Product detail page
- Favorites (with badge), Cart (inventory‑aware), Checkout → Orders history
- Auth: unified login; role‑aware navbar
- Admin SPA: dashboard + Orders, Categories, Products, Inventory, Shipments, Customers
- Admin metrics: total orders, best sellers, top spenders

## Development workflow

1) Start backend first
```powershell
cd backend-bun
bun install
bun src/index.ts
```

2) Start frontend
```powershell
cd frontend
npm install
npm run dev
```

3) Open the app and verify
- Frontend: http://localhost:5173
- Backend: http://localhost:8787/health

## Troubleshooting

- Port already in use (8787)
	- Find and kill process in PowerShell:
		```powershell
		Get-NetTCPConnection -LocalPort 8787 -State Listen | Select-Object -First 1 -ExpandProperty OwningProcess | % { Stop-Process -Id $_ -Force }
		```
- 500 on `/products?category=...`
	- Ensure `categories` and `product_categories` tables exist and `categories.category_name` matches the values you link from Home/Products. Filtering uses a join on those tables.
- Inventory update errors on order success
	- Add `updated_at` column and trigger to `inventory` table to match DB triggers that expect it. The UI prefers `updated_at` when present.
- CORS/auth
	- Make sure `ALLOWED_ORIGINS` includes your frontend URL and `ADMIN_JWT_SECRET`/`USER_JWT_SECRET` are set. Authorization header is allowed by CORS.

## Project structure

```
backend-bun/
	src/
		index.ts                # Server bootstrap + routes
		routes/
			products.ts           # Public products (+category filter via join)
			categories.ts         # Public categories
			admin.ts              # Admin CRUD + metrics
			auth.ts, cart.ts, favorites.ts, orders.ts, addresses.ts
		lib/supabase.ts         # Supabase clients (service-role & request-scoped)
frontend/
	src/
		views/                  # Home, Products, Admin views
		services/               # API clients
		stores/                 # Pinia stores
		router/                 # Vue Router config
		components/             # UI components
	vite.config.ts, tsconfig.json
```

## Notes

- Tailwind CSS v4 is configured via `@import "tailwindcss";` in CSS and purges based on your templates.
- The Products page updates the URL when you change category so links are shareable.
- For production, ensure secrets are secure and do NOT ship service‑role keys to the client. Backend uses service‑role only on the server.