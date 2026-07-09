from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
from crud import get_or_create_user
import models
import schemas

router = APIRouter(prefix="/exercise-muscles", tags=["exercise-muscles"])

# Canonical muscle slugs — must match client/lib/muscle-map.ts Muscle union.
VALID_MUSCLES = {
    "chest", "frontDelts", "backDelts", "biceps", "triceps", "forearms",
    "abs", "obliques", "traps", "lats", "lowerBack", "quads", "hamstrings",
    "glutes", "calves",
}


def _to_response(row):
    return {"id": row.id, "name": row.name, "muscles": row.muscles.split(",") if row.muscles else []}


@router.get("/", response_model=list[schemas.ExerciseMuscleResponse])
def list_exercise_muscles(user=Depends(get_current_user), db: Session = Depends(get_db)):
    db_user = get_or_create_user(db, user)
    rows = db.query(models.ExerciseMuscle).filter(models.ExerciseMuscle.user_id == db_user.id).all()
    return [_to_response(r) for r in rows]


@router.put("/")
def set_exercise_muscles(payload: schemas.ExerciseMuscleCreate, user=Depends(get_current_user), db: Session = Depends(get_db)):
    db_user = get_or_create_user(db, user)
    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Name required")

    muscles = [m for m in payload.muscles if m]
    invalid = [m for m in muscles if m not in VALID_MUSCLES]
    if invalid:
        raise HTTPException(status_code=400, detail=f"Unknown muscles: {', '.join(invalid)}")

    existing = db.query(models.ExerciseMuscle).filter(
        models.ExerciseMuscle.user_id == db_user.id,
        func.lower(models.ExerciseMuscle.name) == name.lower(),
    ).first()

    # An empty selection clears any existing override for this exercise.
    if not muscles:
        if existing:
            db.delete(existing)
            db.commit()
        return {"ok": True, "cleared": True}

    if existing:
        existing.name = name
        existing.muscles = ",".join(muscles)
        db.commit()
        db.refresh(existing)
        return _to_response(existing)

    row = models.ExerciseMuscle(user_id=db_user.id, name=name, muscles=",".join(muscles))
    db.add(row)
    db.commit()
    db.refresh(row)
    return _to_response(row)


@router.delete("/{override_id}")
def delete_exercise_muscle(override_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    db_user = get_or_create_user(db, user)
    row = db.query(models.ExerciseMuscle).filter(
        models.ExerciseMuscle.id == override_id,
        models.ExerciseMuscle.user_id == db_user.id,
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Override not found")
    db.delete(row)
    db.commit()
    return {"ok": True}
