from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
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

router = APIRouter(prefix="/friends", tags=["friends"])


def get_accepted_friendship(db: Session, user_id: int, friend_id: int):
    return db.query(models.Friendship).filter(
        models.Friendship.status == "accepted",
        (
            (models.Friendship.requester_id == user_id) & (models.Friendship.receiver_id == friend_id)
            | (models.Friendship.requester_id == friend_id) & (models.Friendship.receiver_id == user_id)
        )
    ).first()


def serialize_log(log: models.WorkoutLog) -> dict:
    exercises = []
    for ex in log.exercises:
        exercises.append({
            "id": ex.id,
            "name": ex.name,
            "sets": ex.sets,
            "reps": ex.reps,
            "weight": ex.weight,
            "difficulty": ex.difficulty,
            "done": ex.done,
        })
    return {"id": log.id, "plan_name": log.plan_name, "date": log.date, "exercises": exercises}


@router.post("/request", response_model=schemas.FriendshipResponse)
def send_friend_request(body: dict, user=Depends(get_current_user), db: Session = Depends(get_db)):
    email = body.get("email", "").strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Email required")

    db_user = get_or_create_user(db, user)
    target = db.query(models.User).filter(models.User.email == email).first()

    if not target:
        raise HTTPException(status_code=404, detail="Användaren hittades inte")
    if target.id == db_user.id:
        raise HTTPException(status_code=400, detail="Du kan inte lägga till dig själv")

    existing = db.query(models.Friendship).filter(
        (models.Friendship.requester_id == db_user.id) & (models.Friendship.receiver_id == target.id)
        | (models.Friendship.requester_id == target.id) & (models.Friendship.receiver_id == db_user.id)
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Vänförfrågan finns redan")

    friendship = models.Friendship(requester_id=db_user.id, receiver_id=target.id, status="pending")
    db.add(friendship)
    db.commit()
    db.refresh(friendship)

    return {"id": friendship.id, "status": friendship.status, "friend": target}


@router.get("/requests", response_model=list[schemas.FriendshipResponse])
def get_friend_requests(user=Depends(get_current_user), db: Session = Depends(get_db)):
    db_user = get_or_create_user(db, user)
    pending = db.query(models.Friendship).filter(
        models.Friendship.receiver_id == db_user.id,
        models.Friendship.status == "pending"
    ).all()

    result = []
    for f in pending:
        result.append({"id": f.id, "status": f.status, "friend": f.requester})
    return result


@router.get("/", response_model=list[schemas.FriendshipResponse])
def get_friends(user=Depends(get_current_user), db: Session = Depends(get_db)):
    db_user = get_or_create_user(db, user)
    friendships = db.query(models.Friendship).filter(
        models.Friendship.status == "accepted",
        (models.Friendship.requester_id == db_user.id) | (models.Friendship.receiver_id == db_user.id)
    ).all()

    result = []
    for f in friendships:
        friend = f.receiver if f.requester_id == db_user.id else f.requester
        result.append({"id": f.id, "status": f.status, "friend": friend})
    return result


@router.put("/{friendship_id}/accept", response_model=schemas.FriendshipResponse)
def accept_friend_request(friendship_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    db_user = get_or_create_user(db, user)
    friendship = db.query(models.Friendship).filter(
        models.Friendship.id == friendship_id,
        models.Friendship.receiver_id == db_user.id,
        models.Friendship.status == "pending"
    ).first()

    if not friendship:
        raise HTTPException(status_code=404, detail="Vänförfrågan hittades inte")

    friendship.status = "accepted"
    db.commit()
    db.refresh(friendship)

    return {"id": friendship.id, "status": friendship.status, "friend": friendship.requester}


@router.delete("/{friendship_id}")
def delete_friendship(friendship_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    db_user = get_or_create_user(db, user)
    friendship = db.query(models.Friendship).filter(
        models.Friendship.id == friendship_id,
        (models.Friendship.requester_id == db_user.id) | (models.Friendship.receiver_id == db_user.id)
    ).first()

    if not friendship:
        raise HTTPException(status_code=404, detail="Vänskap hittades inte")

    db.delete(friendship)
    db.commit()
    return {"ok": True}


@router.get("/{friend_id}/logs", response_model=list[schemas.WorkoutLogResponse])
def get_friend_logs(friend_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    db_user = get_or_create_user(db, user)

    if not get_accepted_friendship(db, db_user.id, friend_id):
        raise HTTPException(status_code=403, detail="Ni är inte vänner")

    return (
        db.query(models.WorkoutLog)
        .options(joinedload(models.WorkoutLog.exercises))
        .filter(models.WorkoutLog.user_id == friend_id)
        .all()
    )


@router.get("/{friend_id}/stream")
async def stream_friend_logs(friend_id: int, token: str = Query(...)):
    SECRET_KEY = os.getenv("AUTH_SECRET")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        email = payload.get("sub")
        if not email:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = {"email": email}

    async def generator():
        last_count = -1
        while True:
            db = SessionLocal()
            try:
                db_user = get_or_create_user(db, user)
                friendship = get_accepted_friendship(db, db_user.id, friend_id)
                if not friendship:
                    yield {"data": json.dumps({"error": "not friends"})}
                    return

                logs = (
                    db.query(models.WorkoutLog)
                    .options(joinedload(models.WorkoutLog.exercises))
                    .filter(models.WorkoutLog.user_id == friend_id)
                    .all()
                )

                if len(logs) != last_count:
                    last_count = len(logs)
                    yield {"data": json.dumps([serialize_log(l) for l in logs])}
            finally:
                db.close()
            await asyncio.sleep(5)

    return EventSourceResponse(generator())
