from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload, selectinload
from sse_starlette.sse import EventSourceResponse
from database import get_db, SessionLocal
from auth import get_current_user
from crud import get_or_create_user
from jose import jwt, JWTError
import models
import schemas
import asyncio
import json
import os

router = APIRouter(prefix="/logs", tags=["logs"])


def get_log_with_exercises(db: Session, log_id: int) -> models.WorkoutLog | None:
    return (
        db.query(models.WorkoutLog)
        .options(joinedload(models.WorkoutLog.exercises))
        .filter(models.WorkoutLog.id == log_id)
        .first()
    )


@router.get("/", response_model=list[schemas.WorkoutLogResponse])
def get_logs(user=Depends(get_current_user), db: Session = Depends(get_db)):
    db_user = get_or_create_user(db, user)
    logs = (
        db.query(models.WorkoutLog)
        .options(selectinload(models.WorkoutLog.exercises))
        .filter(models.WorkoutLog.user_id == db_user.id)
        .all()
    )
    return logs


def _fetch_log_data(user: dict) -> list:
    db = SessionLocal()
    try:
        db_user = get_or_create_user(db, user)
        logs = (
            db.query(models.WorkoutLog)
            .options(selectinload(models.WorkoutLog.exercises))
            .filter(models.WorkoutLog.user_id == db_user.id)
            .all()
        )
        return [
            {
                "id": log.id,
                "plan_name": log.plan_name,
                "icon": log.icon,
                "date": log.date,
                "exercises": [
                    {"id": e.id, "name": e.name, "sets": e.sets, "reps": e.reps, "weight": e.weight, "difficulty": e.difficulty, "done": e.done, "is_bodyweight": e.is_bodyweight}
                    for e in log.exercises
                ],
            }
            for log in logs
        ]
    finally:
        db.close()


@router.get("/stream")
async def stream_logs(token: str = Query(...)):
    SECRET_KEY = os.getenv("AUTH_SECRET")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        email = payload.get("sub")
        if not email:
            raise HTTPException(status_code=401)
    except JWTError:
        raise HTTPException(status_code=401)
    user = {"email": email}

    async def generator():
        last_sig = ""
        while True:
            data = await asyncio.to_thread(_fetch_log_data, user)
            sig = "-".join(str(d["id"]) for d in data)
            if sig != last_sig:
                last_sig = sig
                yield {"data": json.dumps(data)}
            await asyncio.sleep(2)

    return EventSourceResponse(generator())


@router.get("/exercise-history")
def get_exercise_history(
    names: str = Query(...),
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db_user = get_or_create_user(db, user)
    result = {}
    for name in (n.strip() for n in names.split(",") if n.strip()):
        logs = (
            db.query(models.ExerciseLog)
            .join(models.WorkoutLog)
            .filter(
                models.WorkoutLog.user_id == db_user.id,
                models.ExerciseLog.name == name,
                models.ExerciseLog.done,
                or_(models.ExerciseLog.weight > 0, models.ExerciseLog.is_bodyweight),
            )
            .order_by(models.WorkoutLog.date.desc())
            .all()
        )
        if logs:
            result[name] = {
                "last_weight": logs[0].weight,
                "max_weight": max(log.weight for log in logs),
                "is_bodyweight": bool(logs[0].is_bodyweight),
            }
    return result


@router.post("/", response_model=schemas.WorkoutLogResponse)
def create_log(log: schemas.WorkoutLogCreate, user=Depends(get_current_user), db: Session = Depends(get_db)):
    db_user = get_or_create_user(db, user)

    db_log = models.WorkoutLog(user_id=db_user.id, plan_name=log.plan_name, icon=log.icon, date=log.date)
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
            is_bodyweight=ex.is_bodyweight,
        ))

    db.commit()
    return get_log_with_exercises(db, db_log.id)


@router.put("/{log_id}", response_model=schemas.WorkoutLogResponse)
def update_log(log_id: int, log: schemas.WorkoutLogCreate, user=Depends(get_current_user), db: Session = Depends(get_db)):
    db_user = get_or_create_user(db, user)
    db_log = db.query(models.WorkoutLog).filter(
        models.WorkoutLog.id == log_id,
        models.WorkoutLog.user_id == db_user.id
    ).first()

    if not db_log:
        raise HTTPException(status_code=404, detail="Log not found")

    db_log.plan_name = log.plan_name
    db_log.date = log.date
    db.query(models.ExerciseLog).filter(models.ExerciseLog.log_id == log_id).delete()

    for ex in log.exercises:
        db.add(models.ExerciseLog(
            log_id=db_log.id,
            name=ex.name,
            sets=ex.sets,
            reps=ex.reps,
            weight=ex.weight,
            difficulty=ex.difficulty,
            done=ex.done,
            is_bodyweight=ex.is_bodyweight,
        ))

    db.commit()
    return get_log_with_exercises(db, log_id)


@router.delete("/{log_id}")
def delete_log(log_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    db_user = get_or_create_user(db, user)
    db_log = db.query(models.WorkoutLog).filter(
        models.WorkoutLog.id == log_id,
        models.WorkoutLog.user_id == db_user.id
    ).first()

    if not db_log:
        raise HTTPException(status_code=404, detail="Log not found")

    db.delete(db_log)
    db.commit()
    return {"ok": True}
