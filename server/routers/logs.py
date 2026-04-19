from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from database import get_db
from auth import get_current_user
from crud import get_or_create_user
import models
import schemas

router = APIRouter(prefix="/logs", tags=["logs"])


def get_log_with_exercises(db: Session, log_id: int) -> models.WorkoutLog | None:
    """Fetch a single log with exercises eagerly loaded."""
    return (
        db.query(models.WorkoutLog)
        .options(joinedload(models.WorkoutLog.exercises))
        .filter(models.WorkoutLog.id == log_id)
        .first()
    )


@router.get("/", response_model=list[schemas.WorkoutLogResponse])
def get_logs(user=Depends(get_current_user), db: Session = Depends(get_db)):
    db_user = get_or_create_user(db, user)
    return (
        db.query(models.WorkoutLog)
        .options(joinedload(models.WorkoutLog.exercises))
        .filter(models.WorkoutLog.user_id == db_user.id)
        .all()
    )


@router.post("/", response_model=schemas.WorkoutLogResponse)
def create_log(log: schemas.WorkoutLogCreate, user=Depends(get_current_user), db: Session = Depends(get_db)):
    db_user = get_or_create_user(db, user)

    db_log = models.WorkoutLog(user_id=db_user.id, plan_name=log.plan_name, date=log.date)
    db.add(db_log)
    db.flush()

    for ex in log.exercises:
        db.add(models.ExerciseLog(
            log_id=db_log.id,
            name=ex.name,
            sets=ex.sets,
            reps=ex.reps,
            weight=ex.weight,
            difficulty=ex.difficulty,
            done=ex.done,
        ))

    db.commit()
    return get_log_with_exercises(db, db_log.id)
