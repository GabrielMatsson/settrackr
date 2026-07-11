# SetTrackr


### Background
Gym web app where you can track your workouts with set and rep tracking. The user inputs each workout with name, weight, reps, sets. This get stored and you can view your progress on a statistics page.

### Coach (training & nutrition insights)
A "Coach" tab under both Statistik and Kost that turns your logged data into feedback. It's plain rule-based statistics computed in the backend — no external APIs or AI at runtime.

- **Training coach**: plateau detection with a concrete suggestion, weekly training volume per muscle group, personal records, and an estimated-1RM trend (Epley/Brzycki). A short weekly summary in Swedish.
- **Nutrition coach**: protein and calories tracked against your targets (calories as a ceiling / cut), with per-week trends, a "days on target" streak, and a weekly summary.

**Technical**: a new FastAPI router (`server/routers/insights.py`) exposing `GET /insights/coach` and `GET /insights/nutrition`, a Python port of the exercise→muscle map (`server/muscle_map.py`), and new pages under `client/app/dashboard/statistics/coach` and `client/app/dashboard/foodtracking/coach` (charts via Recharts). Each coach — and the whole Kost section — can be turned off in Profil → Inställningar → Funktioner.

### Screenshots

<table>
  <tr>
    <td><img src="docs/screenshots/01-dashboard.png" height="260" alt="Dashboard" /><br/><sub>Dashboard — daily overview, streaks, and Hasse Hantel</sub></td>
    <td><img src="docs/screenshots/02-food-diary.png" height="260" alt="Food diary" /><br/><sub>Food diary — meal tracking with Avo</sub></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/03-workout-logging.png" height="260" alt="Workout logging" /><br/><sub>Logging a workout (mobile)</sub></td>
    <td><img src="docs/screenshots/04-food-stats.png" height="260" alt="Food statistics" /><br/><sub>Weekly nutrition stats (mobile)</sub></td>
  </tr>
</table>

### TeckStack
Client-side
- Next.js
- Tailwind css
- Auth.js (google login)

Server-side
- FastAPI
- Swagger (endpoint testing)
- JWT verification
- PostgreSQL (via Supabase)

### Mobile (PWA)

SetTrackr is a Progressive Web App and can be installed on iPhone via Safari:

1. Open [settrackr.vercel.app](https://settrackr.vercel.app) in Safari
2. Tap the Share button → **Add to Home Screen**
3. Tap **Add**

The app opens fullscreen with no browser UI, just like a native app.

### Deployment

The app is live at **[settrackr.vercel.app](https://settrackr.vercel.app)**.

- Frontend is hosted on [Vercel](https://vercel.com) and deploys automatically on every push to `main`
- Backend is hosted on [Render](https://render.com) and also deploys automatically on push
- Database runs on [Supabase](https://supabase.com)