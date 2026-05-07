from fastapi import APIRouter, Depends, HTTPException, Query
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
    """Fetch a single log with exercises eagerly loaded."""
    return (
        db.query(models.WorkoutLog)
        .options(joinedload(models.WorkoutLog.exercises))
        .filter(models.WorkoutLog.id == log_id)
        .first()
    )


@router.get("/", response_model=list[schemas.WorkoutLogWithReactionsResponse])
def get_logs(user=Depends(get_current_user), db: Session = Depends(get_db)):
    db_user = get_or_create_user(db, user)
    logs = (
        db.query(models.WorkoutLog)
        .options(
            selectinload(models.WorkoutLog.exercises),
            selectinload(models.WorkoutLog.reactions),
            selectinload(models.WorkoutLog.comments).selectinload(models.WorkoutComment.user),
        )
        .filter(models.WorkoutLog.user_id == db_user.id)
        .all()
    )
    return [
        schemas.WorkoutLogWithReactionsResponse(
            id=log.id,
            plan_name=log.plan_name,
            date=log.date,
            exercises=log.exercises,
            reaction_count=len(log.reactions),
            liked_by_me=False,
            comments=[
                schemas.CommentResponse(
                    id=c.id,
                    body=c.body,
                    created_at=c.created_at,
                    author=schemas.CommentAuthor(id=c.user.id, name=c.user.name, email=c.user.email),
                )
                for c in sorted(log.comments, key=lambda c: c.created_at)
            ],
        )
        for log in logs
    ]


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
            db = SessionLocal()
            try:
                db_user = get_or_create_user(db, user)
                logs = (
                    db.query(models.WorkoutLog)
                    .options(
                        selectinload(models.WorkoutLog.exercises),
                        selectinload(models.WorkoutLog.reactions),
                        selectinload(models.WorkoutLog.comments).selectinload(models.WorkoutComment.user),
                    )
                    .filter(models.WorkoutLog.user_id == db_user.id)
                    .all()
                )
                sig = "-".join(f"{l.id}:{len(l.reactions)}:{len(l.comments)}" for l in logs)
                if sig != last_sig:
                    last_sig = sig
                    data = [
                        {
                            "id": l.id,
                            "plan_name": l.plan_name,
                            "date": l.date,
                            "exercises": [
                                {"id": e.id, "name": e.name, "sets": e.sets, "reps": e.reps, "weight": e.weight, "difficulty": e.difficulty, "done": e.done}
                                for e in l.exercises
                            ],
                            "reaction_count": len(l.reactions),
                            "liked_by_me": False,
                            "comments": [
                                {"id": c.id, "body": c.body, "created_at": c.created_at.isoformat(), "author": {"id": c.user.id, "name": c.user.name, "email": c.user.email}}
                                for c in sorted(l.comments, key=lambda c: c.created_at)
                            ],
                        }
                        for l in logs
                    ]
                    yield {"data": json.dumps(data)}
            finally:
                db.close()
            await asyncio.sleep(5)

    return EventSourceResponse(generator())


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
