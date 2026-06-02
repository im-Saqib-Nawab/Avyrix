# AVYRIX AI — Frontend

Next.js dashboard for AI image/video generation, billing, library, history, settings, and admin.

## Tech stack

- **Framework:** Next.js 16 (App Router)
- **UI:** React 19, Tailwind CSS 4, Framer Motion
- **State:** Zustand (auth, credits, UI)
- **HTTP:** Axios with JWT refresh interceptor
- **Real-time:** Native WebSocket for generation progress

## Local development

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The backend must be running on port 3001.

## Environment variables

Create `.env.local` from `.env.example`:

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Backend base URL **without** `/api` suffix. Local: `http://localhost:3001` |
| `NEXT_PUBLIC_WS_URL` | No | WebSocket base URL. Auto-derived from API URL if omitted (`http→ws`, `https→wss`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | No | Stripe publishable key for billing |

Values are read in [`lib/config.ts`](lib/config.ts). Never hardcode API URLs in components.

### Production example (Vercel)

```env
NEXT_PUBLIC_API_URL=https://avyrix-api.onrender.com
NEXT_PUBLIC_WS_URL=wss://avyrix-api.onrender.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

---

## Deploy to Vercel

### Option A — Root directory `frontend` (recommended)

1. Push repo to GitHub.
2. [Vercel](https://vercel.com) → **Add New Project** → import repo.
3. Set **Root Directory** to `frontend`.
4. Framework: **Next.js** (auto-detected).
5. Add environment variables (see above).
6. Deploy.

### Option B — Deploy from monorepo root

Use the root [`vercel.json`](../vercel.json) at repo root. Vercel will run `npm run build --prefix frontend`.

### Vercel settings summary

| Setting | Value |
|---------|--------|
| Root Directory | `frontend` |
| Build Command | `npm run build` (default) |
| Output Directory | `.next` (default) |
| Install Command | `npm install` (default) |
| Node.js Version | 20.x |

### After deploy

1. Set backend `FRONTEND_URL` to your Vercel URL, e.g. `https://your-app.vercel.app`.
2. Redeploy backend if CORS was failing.
3. Test login, generation, and WebSocket on the live site.

---

## Folder structure

```
app/
  (auth)/           login, signup, forgot-password, reset-password
  (dashboard)/      dashboard, generate, library, history, billing, settings
  admin/            admin overview, users, api-health
  verify-email/     email verification
  page.tsx          landing page
components/
  ui/               button, input, card, modal, toast, …
  layout/           sidebar, topbar, mobile-nav
  dashboard/        welcome, stats, recent generations
hooks/              useAuth, useWebSocket, useCreditSync, useDashboardSummary
lib/                api.ts, config.ts, auth-session.ts
store/              Zustand stores
types/              TypeScript types
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server (port 3000) |
| `npm run build` | Production build |
| `npm run start` | Start production server locally |
| `npm run lint` | ESLint |

## Auth flow

- Access token stored in `localStorage` + sent as `Authorization: Bearer`
- Refresh token in httpOnly cookie; axios interceptor refreshes on 401
- Dashboard layout validates session via `GET /api/auth/me`

## Related

- [Root README](../README.md) — full stack overview
- [Backend README](../backend/README.md) — API reference and backend deploy
