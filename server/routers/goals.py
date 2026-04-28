from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
from crud import get_or_create_user
import models
import schemas

router = APIRouter(prefix="/goals", tags=["goals"])


@router.get("/", response_model=list[schemas.GoalResponse])
def get_goals(user=Depends(get_current_user), db: Session = Depends(get_db)):
    db_user = get_or_create_user(db, user)
    return db.query(models.Goal).filter(models.Goal.user_id == db_user.id).all()


@router.post("/", response_model=schemas.GoalResponse)
def create_goal(goal: schemas.GoalCreate, user=Depends(get_current_user), db: Session = Depends(get_db)):
    db_user = get_or_create_user(db, user)
    db_goal = models.Goal(user_id=db_user.id, name=goal.name, target_weight=goal.target_weight)
    db.add(db_goal)
    db.commit()
    db.refresh(db_goal)
    return db_goal


@router.delete("/{goal_id}")
def delete_goal(goal_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    db_user = get_or_create_user(db, user)
    db_goal = db.query(models.Goal).filter(
        models.Goal.id == goal_id,
        models.Goal.user_id == db_user.id
    ).first()

    if not db_goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    db.delete(db_goal)
    db.commit()
    return {"ok": True}
