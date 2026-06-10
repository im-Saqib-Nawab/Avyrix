# AVYRIX AI — Backend

Production REST + WebSocket API for AVYRIX AI — auth, generations, credits, billing, admin, and real-time job updates.

## Tech stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js 20+, TypeScript |
| HTTP | Express.js |
| Database | PostgreSQL + Prisma ORM |
| Queue | Bull + Redis (optional — in-process fallback if unavailable) |
| Auth | JWT access token + httpOnly refresh cookie |
| Real-time | WebSocket (`ws`) on `/ws` |
| Storage | Cloudinary (primary) or local `/uploads` fallback |
| Payments | Stripe Checkout + webhooks |
| AI | OpenAI (DALL·E 3), Kling, HeyGen |
| Email | Nodemailer (SMTP) |

## Prerequisites

- Node.js 20+
- PostgreSQL 14+ ([Neon](https://neon.tech), Supabase, Render Postgres)
- Optional: Redis TCP URL (`UPSTASH_REDIS_URL`) for Bull queues
- API keys: OpenAI, Kling, HeyGen, Cloudinary, Stripe, SMTP

## Local setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env — DATABASE_URL, JWT secrets, API keys
npx prisma migrate deploy
npm run dev
```

| Endpoint | URL |
|----------|-----|
| API | `http://localhost:3001` |
| Health | `GET http://localhost:3001/health` |
| WebSocket | `ws://localhost:3001/ws?token=<accessToken>` |

### Frontend env (local)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

### Default accounts (auto-created on startup)

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@avyrix.ai` | `Admin@123456` |
| Test user | `test@avyrix.ai` | `Test@123456` |

---

## Deploy to Vercel

Vercel runs the compiled Express app from `dist/app.js`. Set **Root Directory** to `backend`. All build settings come from `backend/vercel.json` — leave dashboard overrides **OFF**.

| Setting | Value |
|---------|--------|
| Root Directory | `backend` |
| Install Command | `npm install --include=dev` |
| Build Command | `npm run build` |
| Output Directory | `dist` |

### Required env vars (Vercel dashboard)

Set all variables from [`.env.example`](.env.example). Critical production values:

| Variable | Example |
|----------|---------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | PostgreSQL connection string |
| `FRONTEND_URL` | `https://avyrix.vercel.app` (no trailing slash — used for CORS) |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | Min 32 chars each |

After deploy, verify: `GET https://avyrix-backend.vercel.app/health`

> **Note:** WebSockets (`/ws`) and Bull background workers are limited on Vercel serverless. Generations use in-process fallback when Redis is unavailable. For full WebSocket + queue support, use [Render](#deploy-to-render-recommended) instead.

---

## Deploy to Render (recommended)

The Express server uses **WebSockets** and **background workers** — it cannot run on Vercel serverless.

### Using render.yaml (blueprint)

1. Push repo to GitHub.
2. Render Dashboard → **New** → **Blueprint** → connect repo.
3. Render reads [`render.yaml`](../render.yaml) at repo root.
4. Fill in secret env vars in the Render dashboard.
5. Attach or create a PostgreSQL instance; set `DATABASE_URL`.

### Manual Render web service

| Setting | Value |
|---------|--------|
| Root Directory | `backend` |
| Runtime | Node |
| Build Command | `npm install && npx prisma generate && npm run build` |
| Start Command | `npx prisma migrate deploy && npm start` |
| Health Check Path | `/health` |

### Required production env vars

See [`.env.example`](.env.example). Critical values:

| Variable | Notes |
|----------|--------|
| `NODE_ENV` | `production` |
| `PORT` | Render sets this automatically (usually `10000`) |
| `DATABASE_URL` | PostgreSQL connection string |
| `FRONTEND_URL` | Your Vercel URL, e.g. `https://avyrix.vercel.app` (no trailing slash) |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | Min 32 chars each — use strong random strings |
| `CLOUDINARY_*` | Image/video storage |
| `STRIPE_*` | Include webhook secret |
| `SMTP_*` | Verification & password reset emails |
| `UPSTASH_REDIS_URL` | Optional — `rediss://...` from Upstash for Bull queues |

### Stripe webhook (production)

```
POST https://<your-backend>/api/billing/webhook
```

Register this URL in Stripe Dashboard. Uses raw body — already configured in `src/app.ts` before JSON middleware.

### CORS

Only `FRONTEND_URL` is allowed. Update it whenever your Vercel domain changes.

---

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | `prisma generate` + TypeScript compile → `dist/` |
| `npm start` | Run production build |
| `npm run start:prod` | Migrate + start (alternative start command) |
| `npm run migrate` | `prisma migrate dev` (local) |
| `npm run migrate:deploy` | `prisma migrate deploy` (production) |
| `npm run db:seed` | Seed database |

---

## Environment variables

All required vars are validated at startup via Zod in `src/config/index.ts`.

| Variable | Purpose |
|----------|---------|
| `PORT` | HTTP port (default `3001`) |
| `DATABASE_URL` | PostgreSQL |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | Min 32 characters |
| `FRONTEND_URL` | CORS origin + email links |
| `OPENAI_API_KEY` | Image generation + prompt enhance |
| `KLING_ACCESS_KEY` / `KLING_SECRET_KEY` | Video generation |
| `HEYGEN_API_KEY` | Video fallback |
| `CLOUDINARY_CLOUD_NAME` / `API_KEY` / `API_SECRET` | Media storage |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Billing |
| `SMTP_*` | Transactional email |
| `UPSTASH_REDIS_URL` | Optional Bull queue Redis (TCP, not REST) |
| `ADMIN_SECRET_KEY` | Admin utilities |

`UPSTASH_REDIS_REST_URL` is **not** used by Bull — only the TCP `UPSTASH_REDIS_URL` works for queues. Without Redis, generations run in-process with WebSocket updates.

---

## API overview

Base URL: `https://your-api.com` (no `/api` prefix on env — routes are under `/api/...`)

### Auth — `/api/auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | — | Create account (+ 100 credits) |
| POST | `/login` | — | Login |
| POST | `/refresh` | Cookie | New access token |
| POST | `/logout` | Bearer | Logout |
| GET | `/me` | Bearer | Current user |
| POST | `/verify-email` | — | Verify email `{ token }` |
| POST | `/resend-verification` | Bearer | Resend verification email |
| POST | `/forgot-password` | — | Password reset email |
| POST | `/reset-password` | — | Reset password |

### Generations — `/api/generations`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/summary` | Dashboard stats + recent 6 |
| POST | `/image` | Queue image generation |
| POST | `/video` | Queue video generation |
| POST | `/enhance-prompt` | GPT prompt enhancement |
| GET | `/` | List (paginated, filterable) |
| DELETE | `/:id` | Delete generation |
| POST | `/:id/reuse` | Reuse prompt/settings |

### Credits — `/api/credits`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/balance` | Current balance |
| GET | `/transactions` | Transaction history |

### Billing — `/api/billing`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/plans` | Credit packs |
| POST | `/checkout` | Stripe Checkout URL |
| POST | `/webhook` | Stripe webhook (raw body) |

### Admin — `/api/admin` (admin role)

Stats, users, credit adjustments, API health.

---

## WebSocket

Connect: `wss://your-api.com/ws?token=<accessToken>`

| Event | Description |
|-------|-------------|
| `GENERATION_STATUS` | Progress updates |
| `GENERATION_COMPLETE` | Job finished — includes `media_url` |
| `GENERATION_FAILED` | Job failed — includes `userMessage` |
| `CREDITS_UPDATED` | Balance changed |

---

## Project structure

```
src/
├── config/          Env validation, plans, DB helpers
├── lib/             Prisma, Redis, Bull, JWT
├── middleware/      Auth, admin, errors, rate limits
├── modules/         auth, generations, credits, billing, admin, users
├── services/        OpenAI, Kling, HeyGen, Cloudinary, email, WebSocket
├── workers/         Image & video generation processors
├── app.ts           Express app + routes
└── server.ts        HTTP + WebSocket server
prisma/
├── schema.prisma
└── migrations/
```

---

## Related

- [Root README](../README.md) — deployment guide (Vercel + Render)
- [Frontend README](../frontend/README.md) — Next.js app and Vercel env vars

## License

Proprietary — AVYRIX AI.
