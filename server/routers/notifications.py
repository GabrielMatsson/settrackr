from fastapi import APIRouter, Query
from sse_starlette.sse import EventSourceResponse
from database import SessionLocal
from crud import get_or_create_user
from auth import decode_stream_token
import models
import asyncio
import json
import time
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
                    # Upper bound at the `now` that becomes the next `since` —
                    # otherwise a log created mid-query lands in two windows
                    # and produces a duplicate notification.
                    models.WorkoutLog.created_at <= now,
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
    payload = decode_stream_token(token)
    user_info = {"email": payload["sub"]}
    token_exp = payload.get("exp")

    async def generator():
        since = datetime.now(timezone.utc).replace(tzinfo=None)
        while True:
            # End the stream when the token it was opened with expires; the
            # client's EventSource reconnects with a fresh one.
            if token_exp and time.time() > token_exp:
                return
            events, since = await asyncio.to_thread(_fetch_notifications, user_info, since)
            if events:
                yield {"data": json.dumps(events)}
            await asyncio.sleep(2)

    return EventSourceResponse(generator())
