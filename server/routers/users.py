from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
from crud import get_or_create_user, get_accepted_friendship
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
        "show_weight_tracking": on(db_user.show_weight_tracking),
        "kcal_target": db_user.kcal_target or 2200,
        "protein_target": db_user.protein_target or 150,
        "target_weight": db_user.target_weight,
        "goal_mode": db_user.goal_mode,
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
    if update.show_weight_tracking is not None:
        db_user.show_weight_tracking = update.show_weight_tracking
    if update.target_weight is not None:
        if not 20 <= update.target_weight <= 400:
            raise HTTPException(status_code=400, detail="target_weight must be between 20 and 400")
        db_user.target_weight = update.target_weight
    if update.goal_mode is not None:
        if update.goal_mode not in ("deff", "maintain", "bulk"):
            raise HTTPException(status_code=400, detail="goal_mode must be deff, maintain or bulk")
        db_user.goal_mode = update.goal_mode
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
    if not get_accepted_friendship(db, current_user.id, user_id):
        raise HTTPException(status_code=403, detail="Not friends")
    logs = db.query(models.WorkoutLog).filter(models.WorkoutLog.user_id == user_id).all()
    return calculate_level(logs)
