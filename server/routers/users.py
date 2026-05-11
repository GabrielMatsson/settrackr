from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
from crud import get_or_create_user
import schemas

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=schemas.UserProfileResponse)
def get_me(user=Depends(get_current_user), db: Session = Depends(get_db)):
    db_user = get_or_create_user(db, user)
    return {
        "name": db_user.name,
        "email": db_user.email,
        "weekly_goal": db_user.weekly_goal or 3,
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
    db.commit()
    db.refresh(db_user)
    return {
        "name": db_user.name,
        "email": db_user.email,
        "weekly_goal": db_user.weekly_goal or 3,
    }
