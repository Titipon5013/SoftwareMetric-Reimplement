# SoftwareMetric-Reimplement

This repo now includes Tailwind CSS v4 in the `frontend` (Vite + Vue 3 + TS) app.

## Frontend: Tailwind CSS

What was added
- Tailwind v4 devDeps and PostCSS pipeline
- `tailwind.config.cjs` and `postcss.config.cjs`
- Entry CSS `src/assets/tailwind.css` with Tailwind and existing base styles
- Minor UI proof in `HomeView.vue`

How to run
1. Install deps
	 - Open terminal in `frontend` and run:
		 ```powershell
		 npm install
		 npm run dev
		 ```
2. Visit the dev server URL printed in the terminal. On Home, you should see a green Tailwind banner.

Notes
- Tailwind v4 uses the `@import "tailwindcss";` entry in CSS. Utilities are tree-shaken based on content configured in `tailwind.config.cjs`.
- Global styles remain in `src/assets/base.css` and are imported after Tailwind to allow overrides.