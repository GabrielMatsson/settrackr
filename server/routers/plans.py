from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from database import get_db
from auth import get_current_user
from crud import get_or_create_user
import models
import schemas

router = APIRouter(prefix="/plans", tags=["plans"])


def get_plan_with_exercises(db: Session, plan_id: int) -> models.WorkoutPlan | None:
    """Fetch a single plan with exercises eagerly loaded."""
    return (
        db.query(models.WorkoutPlan)
        .options(joinedload(models.WorkoutPlan.exercises))
        .filter(models.WorkoutPlan.id == plan_id)
        .first()
    )


@router.get("/", response_model=list[schemas.WorkoutPlanResponse])
def get_plans(user=Depends(get_current_user), db: Session = Depends(get_db)):
    db_user = get_or_create_user(db, user)
    return (
        db.query(models.WorkoutPlan)
        .options(joinedload(models.WorkoutPlan.exercises))
        .filter(models.WorkoutPlan.user_id == db_user.id)
        .all()
    )


@router.post("/", response_model=schemas.WorkoutPlanResponse)
def create_plan(plan: schemas.WorkoutPlanCreate, user=Depends(get_current_user), db: Session = Depends(get_db)):
    db_user = get_or_create_user(db, user)

    db_plan = models.WorkoutPlan(user_id=db_user.id, name=plan.name)
    db.add(db_plan)
    db.flush()

    for i, ex in enumerate(plan.exercises):
        db.add(models.Exercise(plan_id=db_plan.id, name=ex.name, sets=ex.sets, reps=ex.reps, order=i))

    db.commit()
    return get_plan_with_exercises(db, db_plan.id)


@router.put("/{plan_id}", response_model=schemas.WorkoutPlanResponse)
def update_plan(plan_id: int, plan: schemas.WorkoutPlanCreate, user=Depends(get_current_user), db: Session = Depends(get_db)):
    db_user = get_or_create_user(db, user)
    db_plan = db.query(models.WorkoutPlan).filter(
        models.WorkoutPlan.id == plan_id,
        models.WorkoutPlan.user_id == db_user.id
    ).first()

    if not db_plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    db_plan.name = plan.name
    db.query(models.Exercise).filter(models.Exercise.plan_id == plan_id).delete()

    for i, ex in enumerate(plan.exercises):
        db.add(models.Exercise(plan_id=db_plan.id, name=ex.name, sets=ex.sets, reps=ex.reps, order=i))

    db.commit()
    return get_plan_with_exercises(db, plan_id)


@router.delete("/{plan_id}")
def delete_plan(plan_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    db_user = get_or_create_user(db, user)
    db_plan = db.query(models.WorkoutPlan).filter(
        models.WorkoutPlan.id == plan_id,
        models.WorkoutPlan.user_id == db_user.id
    ).first()

    if not db_plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    db.delete(db_plan)
    db.commit()
    return {"ok": True}
