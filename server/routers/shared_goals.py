from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
from crud import get_or_create_user
import models
import schemas

router = APIRouter(prefix="/shared-goals", tags=["shared-goals"])


def get_best_lift(db: Session, user_id: int, exercise_name: str) -> float:
    logs = (
        db.query(models.WorkoutLog)
        .filter(models.WorkoutLog.user_id == user_id)
        .all()
    )
    best = 0.0
    for log in logs:
        for ex in log.exercises:
            if ex.name.lower() == exercise_name.lower() and ex.weight > best:
                best = ex.weight
    return best


def build_response(goal: models.SharedGoal, db: Session) -> schemas.SharedGoalResponse:
    owner_best = get_best_lift(db, goal.owner_id, goal.exercise_name)
    friend_best = get_best_lift(db, goal.friend_id, goal.exercise_name)
    return schemas.SharedGoalResponse(
        id=goal.id,
        exercise_name=goal.exercise_name,
        target_weight=goal.target_weight,
        owner=schemas.UserPublicResponse(id=goal.owner.id, name=goal.owner.name, email=goal.owner.email),
        friend=schemas.UserPublicResponse(id=goal.friend.id, name=goal.friend.name, email=goal.friend.email),
        owner_best=owner_best,
        friend_best=friend_best,
    )


@router.get("/", response_model=list[schemas.SharedGoalResponse])
def get_shared_goals(user=Depends(get_current_user), db: Session = Depends(get_db)):
    db_user = get_or_create_user(db, user)
    goals = (
        db.query(models.SharedGoal)
        .filter(
            (models.SharedGoal.owner_id == db_user.id) | (models.SharedGoal.friend_id == db_user.id)
        )
        .all()
    )
    for g in goals:
        _ = g.owner
        _ = g.friend
    return [build_response(g, db) for g in goals]


@router.post("/", response_model=schemas.SharedGoalResponse)
def create_shared_goal(goal: schemas.SharedGoalCreate, user=Depends(get_current_user), db: Session = Depends(get_db)):
    db_user = get_or_create_user(db, user)

    friendship = db.query(models.Friendship).filter(
        models.Friendship.status == "accepted",
        (
            (models.Friendship.requester_id == db_user.id) & (models.Friendship.receiver_id == goal.friend_id)
            | (models.Friendship.requester_id == goal.friend_id) & (models.Friendship.receiver_id == db_user.id)
        )
    ).first()
    if not friendship:
        raise HTTPException(status_code=403, detail="Ni är inte vänner")

    new_goal = models.SharedGoal(
        owner_id=db_user.id,
        friend_id=goal.friend_id,
        exercise_name=goal.exercise_name,
        target_weight=goal.target_weight,
    )
    db.add(new_goal)
    db.commit()
    db.refresh(new_goal)
    _ = new_goal.owner
    _ = new_goal.friend
    return build_response(new_goal, db)


@router.delete("/{goal_id}")
def delete_shared_goal(goal_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    db_user = get_or_create_user(db, user)
    goal = db.query(models.SharedGoal).filter(
        models.SharedGoal.id == goal_id,
        (models.SharedGoal.owner_id == db_user.id) | (models.SharedGoal.friend_id == db_user.id),
    ).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Målet hittades inte")

    db.delete(goal)
    db.commit()
    return {"ok": True}
