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

## Key Conventions

- **UI language**: Swedish throughout (labels, error messages, placeholders)
- **Weight unit**: kg everywhere
- **Difficulty values**: `"easy"`, `"medium"`, `"hard"` (string literals)
- **DB migrations**: done via raw `ALTER TABLE` in the `lifespan` function in `main.py` — NOT Alembic
- **Auth flow**: Google login (Auth.js) → Next.js API route `/api/auth/token` returns a JWT → frontend sends it as `Authorization: Bearer <token>` → FastAPI verifies it
- **API caching**: `apiFetch` in `api.ts` caches GET responses for 10 seconds and deduplicates in-flight requests
- **Icons**: never use emojis use icons, workout plan icons use Lucide icon names stored as strings (e.g. `"Dumbbell"`, `"Flame"`)

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
| Render | FastAPI backend | Yes, spins down on inactivity | dashboard.render.com |
| Supabase | PostgreSQL database | Yes, pauses after 1 week no activity | supabase.com |
| UptimeRobot | Keep-alive pinger (every 14 min) | Yes | uptimerobot.com |

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

### If Something Breaks
- **Frontend errors**: Vercel → Deployments → Logs
- **Backend errors**: Render → your service → Logs tab
- **Auth broken**: check Google Cloud Console → OAuth client → authorized redirect URIs includes `https://settrackr.vercel.app/api/auth/callback/google`
- **CORS errors**: check `ALLOWED_ORIGIN` env var on Render matches Vercel URL exactly (no trailing slash)
- **All 404s on API**: `NEXT_PUBLIC_API_URL` has a trailing slash — remove it in Vercel env vars then redeploy
- **Render cold start**: first request after inactivity takes ~30-60s — UptimeRobot prevents this by pinging every 14 min
