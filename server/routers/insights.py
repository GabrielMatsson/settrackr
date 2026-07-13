"""Coach: rule-based training insights computed from the user's own logs.

Everything here is deterministic statistics over the existing workout_logs /
exercise_logs / exercise_muscles data — no external calls, no LLM. The single
endpoint GET /insights/coach returns four independently-verifiable sections:

  1. plateaus       — per-exercise stall detection + a concrete suggestion
  2. muscle_volume  — weekly working sets per muscle vs. volume landmarks
  3. prs            — recently broken personal records (weight + estimated 1RM)
  4. one_rm_trends  — estimated-1RM series per exercise (for charting)
  plus weekly_summary (natural Swedish) and meta.

Thresholds are taken from mainstream strength-training practice and are called
out inline so they can be tuned. Data model note: one ExerciseLog row is one
exercise in one session with a single (sets, reps, weight) triple — there are
no per-set rows, so "a set" below means one of that row's `sets` at `weight`.
"""
from collections import defaultdict
from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, selectinload

from auth import get_current_user
from crud import get_or_create_user
from database import get_db
from muscle_map import MUSCLE_LABELS, muscles_for_exercise_with_overrides
import models

router = APIRouter(prefix="/insights", tags=["insights"])

# --- Tunable thresholds -----------------------------------------------------

# 1RM estimation is only trustworthy for low-to-moderate reps; above this the
# Epley/Brzycki formulas drift badly, so we clamp reps used for the estimate.
_MAX_REPS_FOR_1RM = 12

# An exercise must have at least this many logged sessions spanning at least
# this many days before we're willing to call it a plateau — this is what stops
# "logged twice" from ever producing a plateau.
_PLATEAU_MIN_SESSIONS = 4
_PLATEAU_MIN_HISTORY_DAYS = 21

# Plateau = no new estimated-1RM PR within this many days, while still training
# the exercise (see _PLATEAU_STILL_ACTIVE_DAYS). ~3 weeks is a common stall
# window before you'd change something.
_PLATEAU_STALL_DAYS = 21
_PLATEAU_STILL_ACTIVE_DAYS = 14

# Weekly per-muscle set landmarks (working sets/week), following the widely-used
# RP-style volume framework: below MEV you barely maintain, MEV–MAV is the
# productive band, above MRV recovery becomes the limiter.
_VOL_MEV = 6    # minimum effective / maintenance floor
_VOL_MAV_LOW = 10   # lower edge of the productive band
_VOL_MAV_HIGH = 20  # upper edge of the productive band
_VOL_MRV = 22   # above this, flag as high

# How many recent ISO weeks the volume + summary look back over.
_DEFAULT_WEEKS = 8


# --- Small helpers ----------------------------------------------------------

def estimate_1rm(weight: float, reps: int) -> float:
    """Estimated one-rep max, averaging Epley and Brzycki for robustness.

    Epley:   1RM = w * (1 + reps/30)
    Brzycki: 1RM = w * 36 / (37 - reps)   (undefined as reps -> 37)

    Reps are clamped to _MAX_REPS_FOR_1RM; a single rep is already a true max.
    """
    if weight <= 0 or reps <= 0:
        return 0.0
    r = min(reps, _MAX_REPS_FOR_1RM)
    if r == 1:
        return round(weight, 1)
    epley = weight * (1 + r / 30)
    brzycki = weight * 36 / (37 - r)  # safe: r <= 12 keeps denominator >= 25
    return round((epley + brzycki) / 2, 1)


def _parse_date(s: str) -> date | None:
    try:
        return date.fromisoformat(s[:10])
    except (ValueError, TypeError):
        return None


def _iso_week_key(d: date) -> str:
    y, w, _ = d.isocalendar()
    return f"{y}-{w:02d}"


def _week_start(d: date) -> date:
    """Monday of the calendar week containing d (weeks run Monday–Sunday)."""
    return d - timedelta(days=d.weekday())


def _bodyweight_on(entries: list[tuple[date, float]], d: date) -> float | None:
    """Body weight applicable on date d: the latest entry on/before d, falling
    back to the earliest entry when the log predates all weight data (keeps old
    bodyweight logs from silently dropping to extra-kg only), else None.

    `entries` must be sorted ascending by date."""
    if not entries:
        return None
    bw = None
    for entry_date, weight_kg in entries:
        if entry_date <= d:
            bw = weight_kg
        else:
            break
    return bw if bw is not None else entries[0][1]


def _load_weight_entries(db: Session, user_id: int) -> list[tuple[date, float]]:
    """All of the user's body-weight entries as (date, kg), sorted ascending."""
    rows = (
        db.query(models.WeightLog)
        .filter(models.WeightLog.user_id == user_id)
        .order_by(models.WeightLog.date)
        .all()
    )
    entries = []
    for r in rows:
        d = _parse_date(r.date)
        if d:
            entries.append((d, r.weight_kg))
    return entries


# --- Endpoint ---------------------------------------------------------------

@router.get("/coach")
def get_coach(
    weeks: int = Query(_DEFAULT_WEEKS, ge=1, le=52),
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db_user = get_or_create_user(db, user)

    logs = (
        db.query(models.WorkoutLog)
        .options(selectinload(models.WorkoutLog.exercises))
        .filter(models.WorkoutLog.user_id == db_user.id)
        .all()
    )

    # User muscle overrides, keyed by trimmed-lowercased exercise name.
    overrides: dict[str, list[str]] = {}
    for row in db.query(models.ExerciseMuscle).filter(models.ExerciseMuscle.user_id == db_user.id).all():
        overrides[row.name.strip().lower()] = row.muscles.split(",") if row.muscles else []

    today = date.today()
    weekly_goal = db_user.weekly_goal or 3
    weight_entries = _load_weight_entries(db, db_user.id)

    # Flatten to (date, exercise) rows, dropping undated/unnamed noise.
    # "load" is the effective load: extra kg plus the body weight applicable on
    # the log's date for bodyweight exercises (pull-ups etc.). With no logged
    # body weight, load == weight and everything behaves as before.
    entries = []  # list of dicts: date, name, sets, reps, weight, load, difficulty, done
    for log in logs:
        d = _parse_date(log.date)
        if not d:
            continue
        for ex in log.exercises:
            if not ex.name:
                continue
            extra = ex.weight or 0.0
            bw = _bodyweight_on(weight_entries, d) if ex.is_bodyweight else None
            entries.append({
                "date": d,
                "name": ex.name.strip(),
                "sets": ex.sets or 0,
                "reps": ex.reps or 0,
                "weight": extra,
                "load": extra + (bw or 0.0),
                "is_bodyweight": bool(ex.is_bodyweight),
                "difficulty": ex.difficulty,
                "done": ex.done,
            })

    if not entries:
        return {
            "plateaus": [],
            "muscle_volume": [],
            "prs": [],
            "one_rm_trends": [],
            "weekly_summary": "Logga några pass så börjar Coach hitta mönster i din träning.",
            "meta": {"total_sessions": 0, "weeks_analysed": weeks, "generated_at": datetime.utcnow().isoformat() + "Z", "has_data": False},
        }

    # Group weighted entries per exercise, chronologically. Only "done" sets with
    # a real load count toward strength analysis (PRs, plateaus, 1RM).
    by_exercise: dict[str, list[dict]] = defaultdict(list)
    for e in entries:
        if e["load"] > 0 and e["reps"] > 0 and e["done"]:
            by_exercise[e["name"]].append(e)
    for name in by_exercise:
        by_exercise[name].sort(key=lambda x: x["date"])

    prs = _compute_prs(by_exercise, today)
    one_rm_trends = _compute_one_rm_trends(by_exercise)
    plateaus = _compute_plateaus(by_exercise, today)
    muscle_volume = _compute_muscle_volume(entries, overrides, today, weeks)
    weekly_summary = _compose_summary(entries, prs, plateaus, muscle_volume, weekly_goal, today)

    return {
        "plateaus": plateaus,
        "muscle_volume": muscle_volume,
        "prs": prs,
        "one_rm_trends": one_rm_trends,
        "weekly_summary": weekly_summary,
        "meta": {
            "total_sessions": len({(e["date"]) for e in entries}),
            "weeks_analysed": weeks,
            "generated_at": datetime.utcnow().isoformat() + "Z",
            "has_data": True,
        },
    }


def _compute_prs(by_exercise: dict[str, list[dict]], today: date) -> list[dict]:
    """Sessions that set a new all-time best weight or estimated 1RM for that
    exercise. Reported newest-first, limited to a readable recent window."""
    prs = []
    for name, sessions in by_exercise.items():
        best_weight = 0.0
        best_e1rm = 0.0
        for s in sessions:
            e1rm = estimate_1rm(s["load"], s["reps"])
            new_weight = s["load"] > best_weight
            new_e1rm = e1rm > best_e1rm
            # Skip the very first session (everything is trivially a "record").
            is_first = best_weight == 0.0 and best_e1rm == 0.0
            if not is_first and (new_weight or new_e1rm):
                prs.append({
                    "exercise": name,
                    "date": s["date"].isoformat(),
                    "weight": round(s["load"], 1),
                    "reps": s["reps"],
                    "e1rm": e1rm,
                    "type": "weight" if new_weight else "e1rm",
                    "is_bodyweight": s["is_bodyweight"],
                    "days_ago": (today - s["date"]).days,
                })
            best_weight = max(best_weight, s["load"])
            best_e1rm = max(best_e1rm, e1rm)
    prs.sort(key=lambda p: p["date"], reverse=True)
    return prs[:20]


def _compute_one_rm_trends(by_exercise: dict[str, list[dict]]) -> list[dict]:
    """Per-exercise estimated-1RM series (best e1RM per session date), only for
    exercises trained on >= 2 distinct dates so a chart has something to draw."""
    trends = []
    for name, sessions in by_exercise.items():
        by_date: dict[str, float] = {}
        for s in sessions:
            e1rm = estimate_1rm(s["load"], s["reps"])
            key = s["date"].isoformat()
            by_date[key] = max(by_date.get(key, 0.0), e1rm)
        if len(by_date) < 2:
            continue
        points = [{"date": d, "e1rm": v} for d, v in sorted(by_date.items())]
        trends.append({
            "exercise": name,
            "points": points,
            "current": points[-1]["e1rm"],
            "best": max(p["e1rm"] for p in points),
            "sessions": len(points),
        })
    trends.sort(key=lambda t: t["sessions"], reverse=True)
    return trends


def _compute_plateaus(by_exercise: dict[str, list[dict]], today: date) -> list[dict]:
    """Flag actively-trained exercises whose estimated 1RM hasn't set a new best
    in _PLATEAU_STALL_DAYS, with a concrete, difficulty-aware suggestion."""
    plateaus = []
    for name, sessions in by_exercise.items():
        # Distinct training dates gate — never plateau on sparse data.
        dates = sorted({s["date"] for s in sessions})
        if len(dates) < _PLATEAU_MIN_SESSIONS:
            continue
        if (dates[-1] - dates[0]).days < _PLATEAU_MIN_HISTORY_DAYS:
            continue
        # Must still be training it recently to be a "plateau" (vs. abandoned).
        if (today - dates[-1]).days > _PLATEAU_STILL_ACTIVE_DAYS:
            continue

        # Date of the last all-time-best estimated 1RM.
        best_e1rm = 0.0
        best_date = dates[0]
        for s in sessions:
            e1rm = estimate_1rm(s["load"], s["reps"])
            if e1rm > best_e1rm:
                best_e1rm = e1rm
                best_date = s["date"]

        days_since_pr = (today - best_date).days
        if days_since_pr < _PLATEAU_STALL_DAYS:
            continue

        last = sessions[-1]
        suggestion = _plateau_suggestion(last)
        plateaus.append({
            "exercise": name,
            "days_since_pr": days_since_pr,
            "best_e1rm": best_e1rm,
            "last_weight": round(last["load"], 1),
            "last_reps": last["reps"],
            "last_difficulty": last["difficulty"],
            "suggestion": suggestion,
        })
    plateaus.sort(key=lambda p: p["days_since_pr"], reverse=True)
    return plateaus


def _plateau_suggestion(last: dict) -> str:
    """A concrete progressive-overload nudge in Swedish, based on the last set's
    rep range and reported difficulty."""
    reps = last["reps"]
    weight = last["load"]
    difficulty = last["difficulty"]
    bump = max(2.5, round(weight * 0.025 / 2.5) * 2.5)  # ~2.5% rounded to 2.5 kg plate

    if difficulty == "easy":
        return f"Senaste passet kändes lätt – höj vikten med {bump:g} kg nästa gång."
    if reps >= 12:
        return f"Du kör redan högt repantal ({reps}). Höj vikten med {bump:g} kg och sänk till 6–8 reps."
    if reps <= 5 and difficulty == "hard":
        return "Tungt och lågt repantal utan framsteg – lägg in en lättare deload-vecka (~10 % mindre vikt) och bygg upp igen."
    if difficulty == "hard":
        return "Lägg till 1 rep per set innan du höjer vikten – småstegen bryter platån."
    return f"Lägg till 1 rep per set, eller ett extra set. Håller det i två pass, höj vikten med {bump:g} kg."


def _compute_muscle_volume(entries: list[dict], overrides: dict, today: date, weeks: int) -> list[dict]:
    """Average working sets per muscle per week over the recent `weeks` window.

    Each exercise credits its full `sets` to every muscle it targets (same union
    semantics as the statistics heatmap). This slightly over-credits secondary
    movers, so read the bands as a guide, not a prescription.
    """
    cutoff = today - timedelta(weeks=weeks)
    # sets per (muscle, iso-week)
    per_week: dict[str, dict[str, float]] = defaultdict(lambda: defaultdict(float))
    active_weeks: set[str] = set()
    muscle_cache: dict[str, list[str]] = {}

    for e in entries:
        if e["date"] < cutoff or e["date"] > today:
            continue
        if e["sets"] <= 0 or not e["done"]:
            continue
        wk = _iso_week_key(e["date"])
        active_weeks.add(wk)
        name = e["name"]
        if name not in muscle_cache:
            muscle_cache[name] = muscles_for_exercise_with_overrides(name, overrides)
        for m in muscle_cache[name]:
            per_week[m][wk] += e["sets"]

    # Divide by the number of weeks that had ANY training, so a normal rest week
    # doesn't dilute the average toward zero. Fall back to `weeks` if unknown.
    divisor = max(1, len(active_weeks))

    result = []
    for slug, label in MUSCLE_LABELS.items():
        total = sum(per_week[slug].values()) if slug in per_week else 0.0
        avg = round(total / divisor, 1)
        result.append({
            "muscle": slug,
            "label": label,
            "avg_sets_per_week": avg,
            "signal": _volume_signal(avg),
        })
    # Most-trained first so the UI leads with what's covered.
    result.sort(key=lambda r: r["avg_sets_per_week"], reverse=True)
    return result


def _volume_signal(avg: float) -> str:
    """Bucket weekly sets into a landmark band. Values are slugs the UI colors."""
    if avg <= 0:
        return "none"        # otränad
    if avg < _VOL_MEV:
        return "low"         # under underhållsnivå
    if avg < _VOL_MAV_LOW:
        return "maintenance"  # underhåll
    if avg <= _VOL_MAV_HIGH:
        return "optimal"     # produktivt spann
    return "high"            # hög volym / återhämtning kan bli flaskhals


def _compose_summary(entries, prs, plateaus, muscle_volume, weekly_goal, today: date) -> str:
    """Assemble a short, factual-but-encouraging Swedish paragraph from the
    computed facts. Pure string composition — no templating engine, no LLM."""
    # This calendar week only (Monday–today), so counts never exceed 7 days.
    monday = _week_start(today)
    monday_iso = monday.isoformat()
    recent = [e for e in entries if monday <= e["date"] <= today]
    sessions_week = len({e["date"] for e in recent})
    sets_week = sum(e["sets"] for e in recent if e["done"])
    prs_week = [p for p in prs if p["date"] >= monday_iso]

    parts: list[str] = []

    # Sessions vs. goal.
    if sessions_week == 0:
        parts.append("Du har inte loggat något pass den här veckan – dags att komma igång igen!")
    elif sessions_week >= weekly_goal:
        parts.append(f"Starkt jobbat – {sessions_week} pass den här veckan, du nådde ditt mål på {weekly_goal}.")
    else:
        parts.append(f"{sessions_week} av {weekly_goal} pass den här veckan. {weekly_goal - sessions_week} till för att nå målet.")

    if sets_week:
        parts.append(f"Totalt {sets_week} set loggade.")

    # PRs.
    if prs_week:
        top = prs_week[0]
        if len(prs_week) == 1:
            parts.append(f"Nytt rekord i {top['exercise']} ({top['weight']:g} kg × {top['reps']}). Snyggt!")
        else:
            parts.append(f"{len(prs_week)} nya rekord den här veckan, bland annat {top['exercise']} ({top['weight']:g} kg). Snyggt!")

    # Plateaus.
    if plateaus:
        p = plateaus[0]
        parts.append(f"{p['exercise']} har stått stilla i {p['days_since_pr']} dagar – {p['suggestion']}")

    # Undertrained major muscle (only call out clearly-neglected big movers).
    major = {"chest", "lats", "quads", "hamstrings", "glutes"}
    neglected = [m for m in muscle_volume if m["muscle"] in major and m["signal"] in ("none", "low")]
    if neglected:
        labels = ", ".join(m["label"].lower() for m in neglected[:3])
        parts.append(f"Lite låg volym på {labels} den senaste tiden – överväg att lägga till ett set eller en övning.")

    return " ".join(parts)


# ===========================================================================
# Nutrition coach — protein + calories only (fat/carbs intentionally ignored).
#
# Model: how the calorie target is scored depends on the user's goal_mode:
#   deff (deficit)  — the target is a CEILING: at/under is good, over is
#                     flagged, and far under is ALSO flagged (too aggressive).
#   bulk (surplus)  — the target is a FLOOR: at/over is good, under is flagged,
#                     far over is flagged (bulking faster than planned).
#   maintain        — a BAND around the target: close is good, drift either way
#                     is flagged.
#   no mode set     — legacy ceiling behavior, no far-under flag.
# Protein is always a FLOOR to reach. Everything is computed from the user's
# own logged meals and body-weight entries; no external calls.
# ===========================================================================

# A day "hits" protein if within this fraction of the target (small grace so
# 149 g against a 150 g goal still counts).
_PROTEIN_HIT_RATIO = 0.95

# Calorie bands relative to the target (fractions of target).
_KCAL_SLIGHTLY_OVER = 0.10     # deff/none: <= +10% over => slightly_over
_KCAL_WELL_UNDER = 0.80        # deff: avg < 80% of target => too aggressive
_KCAL_SLIGHTLY_UNDER = 0.10    # bulk: within 10% below target => slightly_under
_KCAL_SURPLUS_OVER = 0.15      # bulk: > +15% over => bulking too fast
_KCAL_MAINTAIN_GOOD = 0.05     # maintain: within ±5% => good
_KCAL_MAINTAIN_SLIGHT = 0.10   # maintain: within ±10% => slightly_over/under

# Suggested-target computation (see _suggest_kcal_target).
_KCAL_PER_KG = 7700            # energy content of ~1 kg body mass
_TARGET_STEP_MAX = 300         # max suggested change vs the current target, kcal
_TREND_MIN_ENTRIES = 2         # weight entries needed for a trend
_TREND_MIN_SPAN_DAYS = 14      # entries must span at least this many days
_TREND_MIN_LOGGED_DAYS = 10    # food-logged days required for a suggestion
_TREND_MAX_PLAUSIBLE_KG_WK = 1.5  # steeper than this => noisy scale data
_DESIRED_SURPLUS_KG_WK = 0.25  # lean-bulk pace
_DESIRED_DEFICIT_KG_WK = 0.5   # controlled-cut pace


def _goal_direction(goal_mode: str | None) -> str:
    """Map the user's explicit mode to a scoring direction."""
    return {"bulk": "surplus", "deff": "deficit", "maintain": "maintain"}.get(goal_mode or "", "none")


def _fmt_kg(x: float) -> str:
    """0.25 -> '0,25', 0.5 -> '0,5' — Swedish decimal comma, no trailing zeros."""
    return f"{x:.2f}".rstrip("0").rstrip(".").replace(".", ",")


def _day_nutrition(meals: list[models.Meal]) -> dict[str, dict]:
    """Sum kcal + protein per calendar date across the user's meals."""
    days: dict[str, dict] = {}
    for meal in meals:
        d = meal.date
        if d not in days:
            days[d] = {"kcal": 0.0, "protein": 0.0}
        for it in meal.items:
            factor = (it.grams or 0) / 100
            days[d]["kcal"] += (it.kcal_100g or 0) * factor
            days[d]["protein"] += (it.protein_100g or 0) * factor
    # Round at day level (matches the stats page's day totals closely enough).
    for d in days:
        days[d]["kcal"] = round(days[d]["kcal"])
        days[d]["protein"] = round(days[d]["protein"], 1)
    return days


@router.get("/nutrition")
def get_nutrition(
    weeks: int = Query(8, ge=1, le=52),
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db_user = get_or_create_user(db, user)
    today = date.today()
    cutoff = today - timedelta(weeks=weeks)

    kcal_target = db_user.kcal_target or 2200
    protein_target = db_user.protein_target or 150

    # Goal mode drives how calories are scored. Toggle off => everything
    # behaves exactly as if no mode were set (legacy ceiling model).
    show_weight = True if db_user.show_weight_tracking is None else db_user.show_weight_tracking
    goal_mode = db_user.goal_mode if show_weight else None
    direction = _goal_direction(goal_mode)

    weight_entries = _load_weight_entries(db, db_user.id) if show_weight else []
    current_weight = weight_entries[-1][1] if weight_entries else None
    trend_entries = [e for e in weight_entries if cutoff <= e[0] <= today]
    weekly_change_kg = _weekly_weight_trend(trend_entries)

    meals = (
        db.query(models.Meal)
        .options(selectinload(models.Meal.items))
        .filter(
            models.Meal.user_id == db_user.id,
            models.Meal.date >= cutoff.isoformat(),
            models.Meal.date <= today.isoformat(),
        )
        .all()
    )

    day_totals = _day_nutrition(meals)  # date-str -> {kcal, protein}

    empty_meta = {"logged_days": 0, "weeks_analysed": weeks, "generated_at": datetime.utcnow().isoformat() + "Z", "has_data": False}
    if not day_totals:
        return {
            "protein": {"avg": 0, "target": protein_target, "avg_gap": 0, "pct_days_on_target": 0, "streak": 0, "signal": "none", "suggestion": ""},
            "calories": {"avg": 0, "target": kcal_target, "avg_gap": 0, "days_over": 0, "logged_days": 0, "pct_days_at_or_under": 0, "signal": "none", "suggestion": "", "direction": direction, "mode": goal_mode},
            "weekly_trend": [],
            "weekly_summary": "Logga några dagars måltider så börjar Coach hitta mönster i ditt ätande.",
            "target_suggestion": _make_target_suggestion(direction, goal_mode, 0, 0, weekly_change_kg, kcal_target, current_weight, db_user.target_weight),
            "meta": empty_meta,
        }

    logged = sorted(day_totals.keys())  # ISO strings sort chronologically
    n = len(logged)
    avg_kcal = round(sum(day_totals[d]["kcal"] for d in logged) / n)
    avg_protein = round(sum(day_totals[d]["protein"] for d in logged) / n, 1)

    # --- Protein block ---
    protein_hits = sum(1 for d in logged if day_totals[d]["protein"] >= protein_target * _PROTEIN_HIT_RATIO)
    pct_protein = round(protein_hits / n * 100)
    # Streak: consecutive most-recent logged days that hit the protein target.
    streak = 0
    for d in reversed(logged):
        if day_totals[d]["protein"] >= protein_target * _PROTEIN_HIT_RATIO:
            streak += 1
        else:
            break
    protein_gap = round(protein_target - avg_protein, 1)  # positive => under target
    protein = {
        "avg": avg_protein,
        "target": protein_target,
        "avg_gap": protein_gap,
        "pct_days_on_target": pct_protein,
        "streak": streak,
        "signal": _protein_signal(avg_protein, protein_target),
        "suggestion": _protein_suggestion(avg_protein, protein_target, protein_gap),
    }

    # --- Calorie block (scored per goal mode) ---
    days_over = sum(1 for d in logged if day_totals[d]["kcal"] > kcal_target)
    at_or_under = n - days_over
    kcal_gap = avg_kcal - kcal_target  # positive => over the target
    kcal_signal = _kcal_signal(avg_kcal, kcal_target, direction)
    calories = {
        "avg": avg_kcal,
        "target": kcal_target,
        "avg_gap": kcal_gap,
        "days_over": days_over,
        "logged_days": n,
        "pct_days_at_or_under": round(at_or_under / n * 100),
        "signal": kcal_signal,
        "suggestion": _kcal_suggestion(kcal_gap, days_over, n, direction, kcal_signal),
        "direction": direction,
        "mode": goal_mode,
    }

    weekly_trend = _weekly_nutrition_trend(day_totals)
    weekly_summary = _compose_nutrition_summary(day_totals, today, kcal_target, protein_target, direction)
    target_suggestion = _make_target_suggestion(
        direction, goal_mode, avg_kcal, n, weekly_change_kg, kcal_target, current_weight, db_user.target_weight
    )

    return {
        "protein": protein,
        "calories": calories,
        "weekly_trend": weekly_trend,
        "weekly_summary": weekly_summary,
        "target_suggestion": target_suggestion,
        "meta": {"logged_days": n, "weeks_analysed": weeks, "generated_at": datetime.utcnow().isoformat() + "Z", "has_data": True},
    }


def _make_target_suggestion(direction: str, goal_mode: str | None, avg_kcal: int, logged_days: int,
                            weekly_change_kg: float | None, kcal_target: int,
                            current_weight: float | None, target_weight: float | None) -> dict:
    """The target_suggestion response block: _suggest_kcal_target plus the
    observed inputs, so the client can show verifiable facts next to the number."""
    suggestion = _suggest_kcal_target(direction, avg_kcal, logged_days, weekly_change_kg, kcal_target)
    return {
        "direction": direction,
        "mode": goal_mode,
        "current_weight": current_weight,
        "target_weight": target_weight,
        "weekly_change_kg": round(weekly_change_kg, 2) if weekly_change_kg is not None else None,
        "avg_kcal": avg_kcal,
        "current_target": kcal_target,
        **suggestion,
    }


def _protein_signal(avg: float, target: int) -> str:
    if target <= 0 or avg <= 0:
        return "none"
    ratio = avg / target
    if ratio >= _PROTEIN_HIT_RATIO:
        return "good"
    if ratio >= 0.8:
        return "low"
    return "poor"


def _protein_suggestion(avg: float, target: int, gap: float) -> str:
    if avg <= 0:
        return ""
    if avg >= target * _PROTEIN_HIT_RATIO:
        return "Du når proteinmålet – toppen för muskeluppbyggnad och återhämtning. Håll i det."
    return (f"Du ligger i snitt {gap:.0f} g under proteinmålet. Lägg till en proteinkälla per dag – "
            f"t.ex. kvarg, kyckling eller en proteinshake (~25 g).")


def _kcal_signal(avg: int, target: int, direction: str = "none") -> str:
    if target <= 0 or avg <= 0:
        return "none"
    ratio = avg / target
    if direction == "surplus":
        if ratio > 1 + _KCAL_SURPLUS_OVER:
            return "over"
        if ratio >= 1.0:
            return "good"
        if ratio >= 1 - _KCAL_SLIGHTLY_UNDER:
            return "slightly_under"
        return "under"
    if direction == "maintain":
        if abs(ratio - 1) <= _KCAL_MAINTAIN_GOOD:
            return "good"
        if ratio > 1:
            return "slightly_over" if ratio <= 1 + _KCAL_MAINTAIN_SLIGHT else "over"
        return "slightly_under" if ratio >= 1 - _KCAL_MAINTAIN_SLIGHT else "under"
    # deficit (deff) and no mode: the legacy ceiling — but a confirmed deff also
    # flags a far-too-low average.
    if ratio <= 1.0:
        if direction == "deficit" and ratio < _KCAL_WELL_UNDER:
            return "well_under"
        return "good"
    if ratio <= 1 + _KCAL_SLIGHTLY_OVER:
        return "slightly_over"
    return "over"


def _kcal_suggestion(gap: int, days_over: int, logged_days: int, direction: str = "none", signal: str = "") -> str:
    over_text = (f"Du ligger i snitt {gap} kcal över målet ({days_over} av {logged_days} loggade dagar). "
                 f"Se över portionsstorlekar och mellanmål för att komma i mål.")
    if direction == "surplus":
        if signal == "over":
            return (f"Du ligger i snitt {gap} kcal över målet – mer än bulken behöver, "
                    f"vilket kan ge onödig fettökning. Sikta närmare målet.")
        if signal == "good":
            if gap == 0:
                return "Du landar i snitt precis på kalorimålet – precis vad bulken behöver."
            return f"Du ligger i snitt {gap} kcal över målet – precis vad bulken behöver. Håll i det."
        if signal == "slightly_under":
            return (f"Du ligger i snitt {abs(gap)} kcal under målet – nästan där, men för att bygga "
                    f"behöver du nå upp till målet varje dag.")
        return (f"Du ligger i snitt {abs(gap)} kcal under kalorimålet – för lite för en bulk. "
                f"Lägg till ett mellanmål eller en extra portion.")
    if direction == "maintain":
        if signal == "good":
            return "Du landar i snitt nära kalorimålet – precis rätt för att hålla vikten."
        if gap > 0:
            return over_text
        return (f"Du ligger i snitt {abs(gap)} kcal under målet – lite för lågt för att hålla vikten. "
                f"Ät något mer så du landar närmare målet.")
    if direction == "deficit" and signal == "well_under":
        return (f"Du ligger i snitt {abs(gap)} kcal under målet – ett för stort underskott gör det "
                f"svårt att behålla muskelmassa. Ät närmare målet.")
    # deficit within band + no mode: legacy texts.
    if gap == 0:
        return "Du landar i snitt precis på kalorimålet."
    if gap < 0:
        return f"Du håller dig i snitt {abs(gap)} kcal under kalorimålet – bra för en kontrollerad viktnedgång."
    return over_text


def _weekly_weight_trend(entries: list[tuple[date, float]]) -> float | None:
    """Weight change in kg/week via a least-squares slope over (day, kg) points.

    Returns None when the data can't support a trend: fewer than
    _TREND_MIN_ENTRIES entries or a span shorter than _TREND_MIN_SPAN_DAYS.
    `entries` must be sorted ascending by date."""
    if len(entries) < _TREND_MIN_ENTRIES:
        return None
    days = [(d - entries[0][0]).days for d, _ in entries]
    if days[-1] < _TREND_MIN_SPAN_DAYS:
        return None
    n = len(entries)
    mean_x = sum(days) / n
    mean_y = sum(w for _, w in entries) / n
    denom = sum((x - mean_x) ** 2 for x in days)
    if denom == 0:
        return None
    slope_per_day = sum((x - mean_x) * (w - mean_y) for x, (_, w) in zip(days, entries)) / denom
    return slope_per_day * 7


def _suggest_kcal_target(direction: str, avg_kcal: int, logged_days: int,
                         weekly_change_kg: float | None, current_target: int) -> dict:
    """Suggest a kcal target from observed intake + weight trend.

    No TDEE formula (no height/age/sex data) — instead: the weight trend reveals
    the maintenance level (maintenance = avg intake − trend × 7700/7), and the
    suggestion is maintenance plus the desired pace for the mode. Clamped to
    ±_TARGET_STEP_MAX of the current target so one noisy window never yanks the
    goal, and rounded to 50."""
    if direction == "none":
        return {"basis": "none", "suggested_kcal": None, "est_maintenance": None, "reasoning": ""}
    if (weekly_change_kg is None or logged_days < _TREND_MIN_LOGGED_DAYS
            or abs(weekly_change_kg) > _TREND_MAX_PLAUSIBLE_KG_WK or avg_kcal <= 0):
        return {
            "basis": "direction_only",
            "suggested_kcal": None,
            "est_maintenance": None,
            "reasoning": ("Logga vikten ett par gånger i veckan i minst två veckor, och maten "
                          "de flesta dagar, så kan Coach räkna fram ett kaloriförslag."),
        }

    est_maintenance = avg_kcal - weekly_change_kg * _KCAL_PER_KG / 7
    pace = {"surplus": _DESIRED_SURPLUS_KG_WK, "deficit": -_DESIRED_DEFICIT_KG_WK, "maintain": 0.0}[direction]
    raw = est_maintenance + pace * _KCAL_PER_KG / 7
    clamped = min(max(raw, current_target - _TARGET_STEP_MAX), current_target + _TARGET_STEP_MAX)
    clamped = min(max(clamped, 1200), 6000)
    suggested = int(round(clamped / 50) * 50)

    updown = "gått upp" if weekly_change_kg >= 0 else "gått ner"
    observed = (f"Du har {updown} ~{_fmt_kg(abs(weekly_change_kg))} kg/vecka på i snitt {avg_kcal} kcal "
                f"– det pekar på ett underhåll runt {round(est_maintenance)} kcal.")
    if suggested == current_target:
        goal_part = f"Ditt nuvarande mål på {current_target} kcal ligger rätt för din takt."
    elif direction == "surplus":
        goal_part = f"För att öka ~{_fmt_kg(_DESIRED_SURPLUS_KG_WK)} kg/vecka, sikta på {suggested} kcal."
    elif direction == "deficit":
        goal_part = f"För att minska ~{_fmt_kg(_DESIRED_DEFICIT_KG_WK)} kg/vecka, sikta på {suggested} kcal."
    else:
        goal_part = f"För att hålla vikten, sikta på {suggested} kcal."

    return {
        "basis": "trend",
        "suggested_kcal": suggested,
        "est_maintenance": round(est_maintenance),
        "reasoning": f"{observed} {goal_part}",
    }


def _weekly_nutrition_trend(day_totals: dict[str, dict]) -> list[dict]:
    """Average daily kcal + protein per ISO week (over that week's logged days)."""
    per_week_kcal: dict[str, list[float]] = defaultdict(list)
    per_week_protein: dict[str, list[float]] = defaultdict(list)
    for d, tot in day_totals.items():
        wk = _iso_week_key(date.fromisoformat(d))
        per_week_kcal[wk].append(tot["kcal"])
        per_week_protein[wk].append(tot["protein"])
    weeks_sorted = sorted(per_week_kcal.keys())
    out = []
    for wk in weeks_sorted:
        ks = per_week_kcal[wk]
        ps = per_week_protein[wk]
        out.append({
            "week": f"v.{wk.split('-')[1]}",
            "avg_kcal": round(sum(ks) / len(ks)),
            "avg_protein": round(sum(ps) / len(ps), 1),
            "logged_days": len(ks),
        })
    return out


def _kcal_day_on_target(kcal: float, target: int, direction: str) -> bool:
    """Whether a single day's calories count as 'in mål' for the goal mode."""
    if direction == "surplus":
        return kcal >= target
    if direction == "maintain":
        return abs(kcal / target - 1) <= _KCAL_MAINTAIN_GOOD if target > 0 else False
    return kcal <= target  # deficit + none: the legacy ceiling


def _compose_nutrition_summary(day_totals: dict[str, dict], today: date, kcal_target: int, protein_target: int, direction: str = "none") -> str:
    # This calendar week only (Monday–today), so a "week" is never > 7 days.
    monday = _week_start(today).isoformat()
    today_iso = today.isoformat()
    recent = {d: t for d, t in day_totals.items() if monday <= d <= today_iso}
    parts: list[str] = []

    if not recent:
        return "Du har inte loggat någon mat den här veckan – logga några dagar så ser Coach dina mönster."

    n = len(recent)
    avg_kcal = round(sum(t["kcal"] for t in recent.values()) / n)
    avg_protein = round(sum(t["protein"] for t in recent.values()) / n, 1)
    protein_hits = sum(1 for t in recent.values() if t["protein"] >= protein_target * _PROTEIN_HIT_RATIO)
    on_target = sum(
        1 for t in recent.values()
        if _kcal_day_on_target(t["kcal"], kcal_target, direction) and t["protein"] >= protein_target * _PROTEIN_HIT_RATIO
    )

    parts.append(f"{n} loggade {'dag' if n == 1 else 'dagar'} den här veckan.")

    # Calories (framed by goal mode).
    if direction == "surplus":
        if avg_kcal >= kcal_target:
            parts.append(f"Snittet {avg_kcal} kcal ligger över målet {kcal_target} – bra tempo för bulken.")
        else:
            parts.append(f"Snittet {avg_kcal} kcal ligger {kcal_target - avg_kcal} under målet {kcal_target} – ät lite mer för att bulken ska ge resultat.")
    elif direction == "maintain":
        if _kcal_day_on_target(avg_kcal, kcal_target, "maintain"):
            parts.append(f"Snittet {avg_kcal} kcal ligger nära målet {kcal_target} – bra hållet.")
        elif avg_kcal > kcal_target:
            parts.append(f"Snittet {avg_kcal} kcal ligger {avg_kcal - kcal_target} över målet {kcal_target}.")
        else:
            parts.append(f"Snittet {avg_kcal} kcal ligger {kcal_target - avg_kcal} under målet {kcal_target}.")
    elif direction == "deficit" and kcal_target > 0 and avg_kcal < kcal_target * _KCAL_WELL_UNDER:
        parts.append(f"Snittet {avg_kcal} kcal ligger långt under målet {kcal_target} – för stort underskott för att behålla muskelmassa.")
    elif avg_kcal <= kcal_target:
        parts.append(f"Snittet {avg_kcal} kcal ligger under målet {kcal_target} – bra hållet.")
    else:
        parts.append(f"Snittet {avg_kcal} kcal ligger {avg_kcal - kcal_target} över målet {kcal_target}.")

    # Protein (floor).
    if protein_hits == n:
        parts.append(f"Proteinmålet nått alla {n} dagar ({avg_protein} g i snitt). Starkt!")
    elif avg_protein >= protein_target * _PROTEIN_HIT_RATIO:
        parts.append(f"Protein i snitt {avg_protein} g – i nivå med målet {protein_target} g.")
    else:
        parts.append(f"Protein i snitt {avg_protein} g, under målet {protein_target} g ({protein_hits} av {n} dagar i mål).")

    parts.append(f"Totalt {on_target} av {n} dagar helt i mål (både kalorier och protein).")
    return " ".join(parts)
