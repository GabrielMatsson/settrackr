# SetTrackr

Personal gym workout tracker built as a course project (TDDD27 Advanced Web Programming at LiU), now continued as a personal project. Single-user focus — no need for multi-tenant concerns. The sole user is the developer.

## Tech Stack

**Frontend** (`client/`)
- Next.js (App Router)
- Tailwind CSS
- Auth.js with Google login

**Backend** (`server/`)
- FastAPI
- SQLAlchemy ORM (models in `server/models.py`)
- PostgreSQL via Supabase
- JWT for API auth (verified in `server/auth.py`)
- SSE (Server-Sent Events) for real-time updates

## Dev Commands

### Backend
```powershell
# From server/
venv\Scripts\activate
uvicorn main:app --reload
# Runs on http://localhost:8000
# Swagger docs: http://localhost:8000/docs
```

### Frontend
```powershell
# From client/
npm run dev
# Runs on http://localhost:3000
```

Both must run simultaneously — the frontend calls the backend at port 8000.

### Verifying changes
```powershell
# From client/ — runs typecheck + lint + jest in one go
npm run check
# Full production build check when needed
npm run build
```

### Testing the API locally (no Google login needed)
`server/scripts/api_smoke.py` mints a JWT from `AUTH_SECRET` (same as the frontend token route) and hits the API directly:
```powershell
# With uvicorn running on port 8000, from server/
venv\Scripts\python.exe scripts\api_smoke.py
```
Default run is a read-only smoke pass over all routers. For feature-specific tests, `from scripts.api_smoke import call` in a scratch script and use `call("POST", "/food/", {...})` etc. — create and delete your own test data.

## Project Structure

```
server/
  main.py            # FastAPI app, router registration, DB init
  models.py          # SQLAlchemy models
  schemas.py         # Pydantic schemas
  auth.py            # JWT verification
  crud.py            # get_or_create_user helper
  routers/
    logs.py          # Workout logs CRUD + SSE stream
    plans.py         # Workout plans CRUD + sharing
    friends.py       # Friends + friend logs/stream
    goals.py         # Personal goals
    notifications.py # SSE notification stream
    users.py         # User profile

client/
  app/
    dashboard/
      tracking/      # Log a workout
      statistics/    # Progress charts, goals
      profile/       # Friends, friend profiles
    components/      # Navbar, NotificationProvider, ToastContainer
  lib/
    api.ts           # All API calls (apiFetch with caching)
```

## Git & Commits

- **Always run `git status` before committing** to catch any files the user edited manually that weren't part of Claude's changes — don't commit only the files Claude touched
- **Never commit or push without asking the user first**

## Key Conventions

- **UI language**: Swedish throughout (labels, error messages, placeholders)
- **Weight unit**: kg everywhere
- **Difficulty values**: `"easy"`, `"medium"`, `"hard"` (string literals)
- **DB migrations**: done via raw `ALTER TABLE` in the `lifespan` function in `main.py` — NOT Alembic
- **Auth flow**: Google login (Auth.js) → Next.js API route `/api/auth/token` returns a JWT → frontend sends it as `Authorization: Bearer <token>` → FastAPI verifies it
- **API caching**: `apiFetch` in `api.ts` caches GET responses for 10 seconds and deduplicates in-flight requests
- **Icons**: never use emojis use icons, workout plan icons use Lucide icon names stored as strings (e.g. `"Dumbbell"`, `"Flame"`)

## UI-konventioner

Standard Tailwind tokens — follow these when adding or editing UI:

- **Page background**: `bg-gray-50 dark:bg-gray-950` — set in `DashboardShell.tsx`, never per page
- **Grey palette**: `gray-*` is remapped to Tailwind slate values in `globals.css` `@theme` — always write `gray-*`, never `slate-*`
- **Card**: `bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-card` with `p-5`/`p-6` (tinted section headers inside cards use `bg-gray-50 dark:bg-gray-900`; overlays/modals use `shadow-lg`/`shadow-xl` instead of `shadow-card`)
- **Font**: Geist Sans via `next/font` in `layout.tsx` — never reintroduce Arial/system stacks
- **Page h1**: `text-2xl font-bold text-gray-900 dark:text-white` (exception: home greeting is `text-3xl`)
- **Select/input**: `bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500`
- **Primary button**: `bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg`
- **Status text**: error `text-red-500 dark:text-red-400`, success `text-green-500 dark:text-green-400`
- **Difficulty badge**: use the shared `client/app/components/DifficultyBadge.tsx` (classes come from `getDifficulty` in `lib/workout-utils.ts`) — don't inline badge markup; medium is **amber**, not yellow
- **Page width**: `max-w-4xl mx-auto w-full` (tracking uses 5xl, admin 2xl)
- **Animations**: Motion (`motion/react`) with global `MotionConfig reducedMotion="user"` in providers.tsx — full conventions (springs, durations, patterns) live in the `settrackr-design` project skill (`.claude/skills/settrackr-design/SKILL.md`)

## Deployment

### Live URLs
- **Frontend**: https://settrackr.vercel.app
- **Backend**: https://settrackr.onrender.com
- **API health check**: https://settrackr.onrender.com/ → `{"message":"SetTrackr API is running"}`
- **Swagger docs (prod)**: https://settrackr.onrender.com/docs

### Services
| Service | Purpose | Free tier | Dashboard |
|---|---|---|---|
| Vercel | Next.js frontend | Yes, unlimited | vercel.com |
| Render | FastAPI backend | Yes, spins down after 15 idle min (cold boot 30-60s) | dashboard.render.com |
| Supabase | PostgreSQL database | Yes, pauses after 1 week no activity | supabase.com |
| UptimeRobot | Primary keep-alive pinger (every 5 min, `GET /` — `HEAD /` also supported) | Yes | uptimerobot.com |

Backup pinger: `.github/workflows/keepalive.yml` curls the backend every ~10 min via GitHub Actions cron (can drift a few minutes — UptimeRobot is primary).

### Environment Variables

**Vercel** (frontend build-time):
- `NEXT_PUBLIC_API_URL` — `https://settrackr.onrender.com` (no trailing slash)
- `AUTH_GOOGLE_ID` — Google OAuth client ID
- `AUTH_GOOGLE_SECRET` — Google OAuth client secret
- `AUTH_SECRET` — shared JWT secret (same value as backend)
- `AUTH_URL` — `https://settrackr.vercel.app`

**Render** (backend runtime):
- `DATABASE_URL` — Supabase PostgreSQL connection string
- `AUTH_SECRET` — shared JWT secret (same value as frontend)
- `ALLOWED_ORIGIN` — `https://settrackr.vercel.app`

### Deploying Changes
- **Frontend**: push to `main` → Vercel auto-deploys (~1 min)
- **Backend**: push to `main` → Render auto-deploys (~2 min)
- No manual steps needed after initial setup

### Health Check & Deploy Verification
Run `healthcheck.ps1` at the repo root:
```powershell
.\healthcheck.ps1        # both services up? backend running local HEAD?
.\healthcheck.ps1 -Wait  # after git push: poll up to 10 min until Render serves the new commit (normal deploy ~7-8 min)
```
**Only run healthcheck when the user asks for it** — never automatically after pushes. The backend exposes its commit via `RENDER_GIT_COMMIT` in the root endpoint, and the script compares it to local `git rev-parse HEAD` — this catches Render's stale-deploy problem (Render has NOT auto-deployed on push; every deploy 2026-07-04 → 07-06 needed Manual Deploy in the dashboard). On MISMATCH: Render dashboard → Deploys → Manual Deploy. A DOWN result may just be a cold start — the script uses a 60s timeout, but retry once if needed.

### If Something Breaks
- **Frontend errors**: Vercel → Deployments → Logs
- **Backend errors**: Render → your service → Logs tab
- **Auth broken**: check Google Cloud Console → OAuth client → authorized redirect URIs includes `https://settrackr.vercel.app/api/auth/callback/google`
- **CORS errors**: check `ALLOWED_ORIGIN` env var on Render matches Vercel URL exactly (no trailing slash)
- **All 404s on API**: `NEXT_PUBLIC_API_URL` has a trailing slash — remove it in Vercel env vars then redeploy
- **Render cold start**: first request after 15 idle min takes ~30-60s — UptimeRobot (5 min) + `keepalive.yml` (10 min) prevent this; the frontend also fires `warmUp()` on load and shows the "Servern vaknar…" banner (`ColdStartBanner.tsx`) while GETs auto-retry
