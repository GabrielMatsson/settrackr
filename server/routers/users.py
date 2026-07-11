from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from database import get_db
from auth import get_current_user
from crud import get_or_create_user
from utils import calculate_xp, xp_to_level
import schemas
import models

router = APIRouter(prefix="/users", tags=["users"])


def calculate_level(logs) -> schemas.LevelResponse:
    xp = calculate_xp(logs)
    return schemas.LevelResponse(**xp_to_level(xp))


def _profile_dict(db_user) -> dict:
    # Feature toggles default ON, so coerce NULL (freshly-added column) to True —
    # never use `or True`, which would also flip an explicit False back to True.
    def on(value):
        return True if value is None else value

    return {
        "name": db_user.name,
        "email": db_user.email,
        "weekly_goal": db_user.weekly_goal or 3,
        "show_overload_hints": db_user.show_overload_hints or False,
        "show_chicken_legs": db_user.show_chicken_legs or False,
        "show_gym_ghost": db_user.show_gym_ghost or False,
        "show_gym_mascot": db_user.show_gym_mascot or False,
        "show_food_mascot": db_user.show_food_mascot or False,
        "show_training_coach": on(db_user.show_training_coach),
        "show_nutrition_coach": on(db_user.show_nutrition_coach),
        "show_food_tracking": on(db_user.show_food_tracking),
        "kcal_target": db_user.kcal_target or 2200,
        "protein_target": db_user.protein_target or 150,
    }


@router.get("/me", response_model=schemas.UserProfileResponse)
def get_me(user=Depends(get_current_user), db: Session = Depends(get_db)):
    db_user = get_or_create_user(db, user)
    return _profile_dict(db_user)


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
    if update.show_chicken_legs is not None:
        db_user.show_chicken_legs = update.show_chicken_legs
    if update.show_gym_ghost is not None:
        db_user.show_gym_ghost = update.show_gym_ghost
    if update.show_gym_mascot is not None:
        db_user.show_gym_mascot = update.show_gym_mascot
    if update.show_food_mascot is not None:
        db_user.show_food_mascot = update.show_food_mascot
    if update.show_training_coach is not None:
        db_user.show_training_coach = update.show_training_coach
    if update.show_nutrition_coach is not None:
        db_user.show_nutrition_coach = update.show_nutrition_coach
    if update.show_food_tracking is not None:
        db_user.show_food_tracking = update.show_food_tracking
    if update.kcal_target is not None:
        if not 500 <= update.kcal_target <= 10000:
            raise HTTPException(status_code=400, detail="kcal_target must be between 500 and 10000")
        db_user.kcal_target = update.kcal_target
    if update.protein_target is not None:
        if not 10 <= update.protein_target <= 500:
            raise HTTPException(status_code=400, detail="protein_target must be between 10 and 500")
        db_user.protein_target = update.protein_target
    db.commit()
    db.refresh(db_user)
    return _profile_dict(db_user)


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
