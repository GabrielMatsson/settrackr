from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from database import get_db
from auth import get_current_user
from crud import get_or_create_user
import schemas
import models

router = APIRouter(prefix="/users", tags=["users"])

LEVELS = [
    (0, 1, "Nybörjare"),
    (250, 2, "Motionär"),
    (1000, 3, "Atlet"),
    (2500, 4, "Veteran"),
    (5000, 5, "Elit"),
    (12500, 6, "Mästare"),
]


def calculate_level(logs) -> schemas.LevelResponse:
    sorted_logs = sorted(logs, key=lambda l: l.date)
    prev_max: dict[str, float] = {}
    total_xp = 0

    for log in sorted_logs:
        xp = 50
        if any(ex.difficulty == "hard" for ex in log.exercises):
            xp += 25
        for ex in log.exercises:
            if ex.weight and ex.weight > 0 and ex.weight > prev_max.get(ex.name, 0):
                xp += 50
                break
        for ex in log.exercises:
            if ex.weight and ex.weight > 0:
                prev_max[ex.name] = max(prev_max.get(ex.name, 0), ex.weight)
        total_xp += xp

    current = LEVELS[0]
    next_lvl = LEVELS[1]
    for i, entry in enumerate(LEVELS):
        if total_xp >= entry[0]:
            current = entry
            next_lvl = LEVELS[i + 1] if i + 1 < len(LEVELS) else None

    curr_threshold, level_num, title = current
    next_threshold = next_lvl[0] if next_lvl else None
    next_title = next_lvl[2] if next_lvl else None

    if next_threshold:
        span = next_threshold - curr_threshold
        progress_pct = round(min(100.0, (total_xp - curr_threshold) / span * 100), 1)
    else:
        progress_pct = 100.0

    return schemas.LevelResponse(
        xp=total_xp,
        level=level_num,
        title=title,
        current_threshold=curr_threshold,
        next_threshold=next_threshold,
        next_title=next_title,
        progress_pct=progress_pct,
    )


@router.get("/me", response_model=schemas.UserProfileResponse)
def get_me(user=Depends(get_current_user), db: Session = Depends(get_db)):
    db_user = get_or_create_user(db, user)
    return {
        "name": db_user.name,
        "email": db_user.email,
        "weekly_goal": db_user.weekly_goal or 3,
        "show_overload_hints": db_user.show_overload_hints or False,
    }


@router.patch("/me", response_model=schemas.UserProfileResponse)
def update_me(update: schemas.UserProfileUpdate, user=Depends(get_current_user), db: Session = Depends(get_db)):
    db_user = get_or_create_user(db, user)
    if update.name is not None:
        db_user.name = update.name
    if update.weekly_goal is not None:
        if not 1 <= update.weekly_goal <= 14:
            raise HTTPException(status_code=400, detail="weekly_goal must be between 1 and 14")
        db_user.weekly_goal = update.weekly_goal
    if update.show_overload_hints is not None:
        db_user.show_overload_hints = update.show_overload_hints
    db.commit()
    db.refresh(db_user)
    return {
        "name": db_user.name,
        "email": db_user.email,
        "weekly_goal": db_user.weekly_goal or 3,
        "show_overload_hints": db_user.show_overload_hints or False,
    }


@router.get("/me/level", response_model=schemas.LevelResponse)
def get_my_level(user=Depends(get_current_user), db: Session = Depends(get_db)):
    db_user = get_or_create_user(db, user)
    logs = db.query(models.WorkoutLog).filter(models.WorkoutLog.user_id == db_user.id).all()
    return calculate_level(logs)


@router.get("/{user_id}/level", response_model=schemas.LevelResponse)
def get_friend_level(user_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    current_user = get_or_create_user(db, user)
    friendship = db.query(models.Friendship).filter(
        models.Friendship.status == "accepted",
        or_(
            and_(models.Friendship.requester_id == current_user.id, models.Friendship.receiver_id == user_id),
            and_(models.Friendship.requester_id == user_id, models.Friendship.receiver_id == current_user.id),
        )
    ).first()
    if not friendship:
        raise HTTPException(status_code=403, detail="Not friends")
    logs = db.query(models.WorkoutLog).filter(models.WorkoutLog.user_id == user_id).all()
    return calculate_level(logs)
