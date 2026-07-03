from fastapi import APIRouter, HTTPException, Query
from sse_starlette.sse import EventSourceResponse
from database import SessionLocal
from crud import get_or_create_user
from jose import jwt, JWTError
import models
import asyncio
import json
import os
from datetime import datetime, timezone

router = APIRouter(prefix="/notifications", tags=["notifications"])


def _fetch_notifications(user_info: dict, since: datetime) -> tuple:
    db = SessionLocal()
    try:
        db_user = get_or_create_user(db, user_info)
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        events = []

        friendships = db.query(models.Friendship).filter(
            (
                (models.Friendship.requester_id == db_user.id)
                | (models.Friendship.receiver_id == db_user.id)
            ),
            models.Friendship.status == "accepted",
        ).all()
        friend_ids = [
            f.receiver_id if f.requester_id == db_user.id else f.requester_id
            for f in friendships
        ]
        if friend_ids:
            new_friend_logs = (
                db.query(models.WorkoutLog, models.User)
                .join(models.User, models.WorkoutLog.user_id == models.User.id)
                .filter(
                    models.WorkoutLog.user_id.in_(friend_ids),
                    models.WorkoutLog.created_at > since,
                )
                .all()
            )
            for log, actor in new_friend_logs:
                name = actor.name or actor.email.split("@")[0]
                events.append({
                    "type": "new_log",
                    "message": f"{name} loggade ett nytt träningspass – {log.plan_name}",
                })

        return events, now
    finally:
        db.close()


@router.get("/stream")
async def stream_notifications(token: str = Query(...)):
    SECRET_KEY = os.getenv("AUTH_SECRET")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        email = payload.get("sub")
        if not email:
            raise HTTPException(status_code=401)
    except JWTError:
        raise HTTPException(status_code=401)
    user_info = {"email": email}

    async def generator():
        since = datetime.now(timezone.utc).replace(tzinfo=None)
        while True:
            events, since = await asyncio.to_thread(_fetch_notifications, user_info, since)
            if events:
                yield {"data": json.dumps(events)}
            await asyncio.sleep(2)

    return EventSourceResponse(generator())
