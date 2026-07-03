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
    social.py        # (stub, social features removed)
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
