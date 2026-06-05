# AVYRIX AI

Full-stack AI creative platform — generate images and videos, manage credits, billing, library, and admin tools.

| Layer | Stack | Deploy target |
|-------|--------|---------------|
| **Frontend** | Next.js 16, React 19, Tailwind, Zustand | [Vercel](https://vercel.com) |
| **Backend** | Node.js, Express, Prisma, PostgreSQL, WebSocket | [Render](https://render.com) (recommended) |
| **Database** | PostgreSQL (Neon, Supabase, Render) | Managed Postgres |
| **Storage** | Cloudinary | Cloudinary dashboard |
| **Payments** | Stripe Checkout + webhooks | Stripe dashboard |

## Architecture

```
┌─────────────────┐      HTTPS REST       ┌──────────────────┐
│  Next.js (Vercel)│ ────────────────────► │ Express API      │
│  localhost:3000  │      WSS /ws          │ (Render/VPS)     │
└─────────────────┘ ◄──────────────────── └────────┬─────────┘
                                                     │
                    ┌────────────────────────────────┼────────────┐
                    ▼                ▼               ▼            ▼
              PostgreSQL        Cloudinary       OpenAI/Kling   Stripe
```

The **frontend** deploys to Vercel. The **backend** must run as a long-lived Node process (WebSockets, background generation workers). It does **not** run on Vercel serverless — use Render, Railway, Fly.io, or a VPS.

## Quick start (local)

### Prerequisites

- Node.js 20+
- PostgreSQL database (e.g. [Neon](https://neon.tech))
- API keys: OpenAI, Kling, HeyGen, Cloudinary, Stripe, SMTP

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# Fill in DATABASE_URL, JWT secrets, API keys (see backend/.env.example)
npx prisma migrate deploy
npm run dev
```

API: `http://localhost:3001` · Health: `GET /health`

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

App: `http://localhost:3000`

### 3. Run both (from repo root)

```bash
npm install
npm run dev
```

### Default admin account

| Email | Password |
|-------|----------|
| `admin@avyrix.ai` | `Admin@123456` |

Created automatically on backend startup via `ensureCoreUsers`.

---

## Production deployment

### Step 1 — Deploy backend (Render)

1. Push this repo to GitHub.
2. In [Render](https://render.com), create a **Web Service** from the repo.
3. Use the included [`render.yaml`](render.yaml) blueprint, or configure manually:
   - **Root directory:** `backend`
   - **Build:** `npm install && npx prisma generate && npm run build`
   - **Start:** `npx prisma migrate deploy && npm start`
   - **Health check path:** `/health`
4. Add a **PostgreSQL** database and set `DATABASE_URL`.
5. Set all env vars from [`backend/.env.example`](backend/.env.example).
6. Set `FRONTEND_URL` to your Vercel URL (after Step 2), e.g. `https://avyrix.vercel.app`.
7. Set `NODE_ENV=production`.

Note your backend URL, e.g. `https://avyrix-api.onrender.com`.

### Step 2 — Deploy frontend (Vercel)

1. Import the GitHub repo in [Vercel](https://vercel.com).
2. **Root Directory:** `frontend` (recommended)  
   — or deploy from repo root using the root [`vercel.json`](vercel.json).
3. **Framework preset:** Next.js (auto-detected).
4. **Environment variables** (Production):

   | Variable | Example |
   |----------|---------|
   | `NEXT_PUBLIC_API_URL` | `https://avyrix-backend.vercel.app` |
   | `NEXT_PUBLIC_WS_URL` | `wss://avyrix-backend.vercel.app` (optional — auto-derived if omitted) |
   | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` |

5. Deploy.

### Step 2b — Deploy backend (Vercel)

1. Create a **second** Vercel project from the same repo.
2. **Root Directory:** `backend`
3. Vercel auto-detects Express from `src/app.ts`. Build uses [`backend/vercel.json`](backend/vercel.json).
4. **Environment variables** — set all values from [`backend/.env.example`](backend/.env.example). Critical:

   | Variable | Example |
   |----------|---------|
   | `FRONTEND_URL` | `https://avyrix.vercel.app` |
   | `DATABASE_URL` | PostgreSQL connection string |
   | `NODE_ENV` | `production` |

5. Deploy and verify `GET https://avyrix-backend.vercel.app/health`.

### Step 3 — Post-deploy checklist

- [ ] Backend `GET /health` returns `{ success: true }`
- [ ] Backend `FRONTEND_URL` matches your Vercel domain exactly (no trailing slash)
- [ ] Register/login works on Vercel app
- [ ] Stripe webhook: `https://<backend>/api/billing/webhook`
- [ ] Cloudinary uploads work (image generation)
- [ ] WebSocket connects during generation (`wss://` in browser Network tab)

---

## Project structure

```
avyrix-ai/
├── frontend/          # Next.js app → Vercel
│   ├── app/           # App Router pages
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   └── vercel.json
├── backend/           # Express API → Render/VPS
│   ├── prisma/
│   ├── src/
│   └── render.yaml (via root)
├── render.yaml        # Backend Render blueprint
├── vercel.json        # Monorepo Vercel config (optional)
└── README.md          # This file
```

## Documentation

- [Frontend README](frontend/README.md) — UI, env vars, Vercel setup
- [Backend README](backend/README.md) — API, env vars, Render setup

## License

Proprietary — AVYRIX AI.
