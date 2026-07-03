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
    return {
        "id": log.id,
        "plan_name": log.plan_name,
        "icon": log.icon,
        "date": log.date,
        "exercises": [
            {"id": ex.id, "name": ex.name, "sets": ex.sets, "reps": ex.reps, "weight": ex.weight, "difficulty": ex.difficulty, "done": ex.done}
            for ex in log.exercises
        ],
    }


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


def _fetch_friend_requests(user: dict) -> list:
    db = SessionLocal()
    try:
        db_user = get_or_create_user(db, user)
        pending = db.query(models.Friendship).filter(
            models.Friendship.receiver_id == db_user.id,
            models.Friendship.status == "pending"
        ).all()
        return [
            {"id": f.id, "status": f.status, "friend": {"id": f.requester.id, "name": f.requester.name, "email": f.requester.email}}
            for f in pending
        ]
    finally:
        db.close()


@router.get("/requests/stream")
async def stream_friend_requests(token: str = Query(...)):
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
            data = await asyncio.to_thread(_fetch_friend_requests, user)
            sig = str(len(data))
            if sig != last_sig:
                last_sig = sig
                yield {"data": json.dumps(data)}
            await asyncio.sleep(5)

    return EventSourceResponse(generator())


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


@router.get("/{friend_id}/plans", response_model=list[schemas.WorkoutPlanResponse])
def get_friend_plans(friend_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    db_user = get_or_create_user(db, user)

    if not get_accepted_friendship(db, db_user.id, friend_id):
        raise HTTPException(status_code=403, detail="Ni är inte vänner")

    plans = (
        db.query(models.WorkoutPlan)
        .options(joinedload(models.WorkoutPlan.exercises))
        .filter(models.WorkoutPlan.user_id == friend_id)
        .all()
    )
    return [
        schemas.WorkoutPlanResponse(id=p.id, name=p.name, exercises=p.exercises, shared_with=[])
        for p in plans
    ]


@router.post("/{friend_id}/plans/{plan_id}/copy", response_model=schemas.WorkoutPlanResponse)
def copy_friend_plan(friend_id: int, plan_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    db_user = get_or_create_user(db, user)

    if not get_accepted_friendship(db, db_user.id, friend_id):
        raise HTTPException(status_code=403, detail="Ni är inte vänner")

    original = (
        db.query(models.WorkoutPlan)
        .options(joinedload(models.WorkoutPlan.exercises))
        .filter(models.WorkoutPlan.id == plan_id, models.WorkoutPlan.user_id == friend_id)
        .first()
    )
    if not original:
        raise HTTPException(status_code=404, detail="Planen hittades inte")

    friend_user = db.query(models.User).filter(models.User.id == friend_id).first()
    friend_display = (friend_user.name or friend_user.email.split("@")[0]) if friend_user else "okänd"
    new_plan = models.WorkoutPlan(user_id=db_user.id, name=original.name, copied_from_name=friend_display)
    db.add(new_plan)
    db.flush()

    for i, ex in enumerate(original.exercises):
        db.add(models.Exercise(plan_id=new_plan.id, name=ex.name, sets=ex.sets, reps=ex.reps, order=i))

    db.commit()
    db.refresh(new_plan)
    db.expire(new_plan)

    result = (
        db.query(models.WorkoutPlan)
        .options(joinedload(models.WorkoutPlan.exercises))
        .filter(models.WorkoutPlan.id == new_plan.id)
        .first()
    )
    return schemas.WorkoutPlanResponse(id=result.id, name=result.name, exercises=result.exercises, shared_with=[])


@router.get("/{friend_id}/logs", response_model=list[schemas.WorkoutLogResponse])
def get_friend_logs(friend_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    db_user = get_or_create_user(db, user)

    if not get_accepted_friendship(db, db_user.id, friend_id):
        raise HTTPException(status_code=403, detail="Ni är inte vänner")

    logs = (
        db.query(models.WorkoutLog)
        .options(selectinload(models.WorkoutLog.exercises))
        .filter(models.WorkoutLog.user_id == friend_id)
        .all()
    )
    return logs


def _fetch_friend_log_data(user: dict, friend_id: int) -> tuple:
    db = SessionLocal()
    try:
        db_user = get_or_create_user(db, user)
        if not get_accepted_friendship(db, db_user.id, friend_id):
            return None, None
        logs = (
            db.query(models.WorkoutLog)
            .options(selectinload(models.WorkoutLog.exercises))
            .filter(models.WorkoutLog.user_id == friend_id)
            .all()
        )
        return db_user.id, [serialize_log(log) for log in logs]
    finally:
        db.close()


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
        last_sig = ""
        while True:
            viewer_id, data = await asyncio.to_thread(_fetch_friend_log_data, user, friend_id)
            if viewer_id is None:
                yield {"data": json.dumps({"error": "not friends"})}
                return
            sig = f"{len(data)}-" + "-".join(str(d["id"]) for d in data)
            if sig != last_sig:
                last_sig = sig
                yield {"data": json.dumps(data)}
            await asyncio.sleep(2)

    return EventSourceResponse(generator())
