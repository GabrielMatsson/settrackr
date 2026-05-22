from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
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

router = APIRouter(prefix="/plans", tags=["plans"])


def get_plan_with_exercises(db: Session, plan_id: int) -> models.WorkoutPlan | None:
    return (
        db.query(models.WorkoutPlan)
        .options(
            joinedload(models.WorkoutPlan.exercises),
            joinedload(models.WorkoutPlan.shared_with).joinedload(models.SharedPlanAccess.friend),
        )
        .filter(models.WorkoutPlan.id == plan_id)
        .first()
    )


def serialize_plan(plan: models.WorkoutPlan) -> schemas.WorkoutPlanResponse:
    return schemas.WorkoutPlanResponse(
        id=plan.id,
        name=plan.name,
        icon=plan.icon,
        copied_from_name=plan.copied_from_name,
        exercises=plan.exercises,
        shared_with=[
            schemas.SharedAccessSummary(
                id=sa.id,
                friend=schemas.UserPublicResponse(id=sa.friend.id, name=sa.friend.name, email=sa.friend.email),
                status=sa.status,
            )
            for sa in plan.shared_with
        ],
    )


def serialize_invitation(access: models.SharedPlanAccess) -> dict:
    return {
        "id": access.id,
        "plan_id": access.plan.id,
        "plan_name": access.plan.name,
        "exercises": [{"id": e.id, "name": e.name, "sets": e.sets, "reps": e.reps} for e in access.plan.exercises],
        "from_user": {"id": access.plan.user.id, "name": access.plan.user.name, "email": access.plan.user.email},
    }


@router.get("/invitations", response_model=list[schemas.PlanInvitationResponse])
def get_plan_invitations(user=Depends(get_current_user), db: Session = Depends(get_db)):
    db_user = get_or_create_user(db, user)
    accesses = (
        db.query(models.SharedPlanAccess)
        .options(
            joinedload(models.SharedPlanAccess.plan).joinedload(models.WorkoutPlan.exercises),
            joinedload(models.SharedPlanAccess.plan).joinedload(models.WorkoutPlan.user),
        )
        .filter(
            models.SharedPlanAccess.friend_id == db_user.id,
            models.SharedPlanAccess.status == "pending",
        )
        .all()
    )
    return [
        schemas.PlanInvitationResponse(
            id=a.id,
            plan_id=a.plan.id,
            plan_name=a.plan.name,
            exercises=a.plan.exercises,
            from_user=a.plan.user,
        )
        for a in accesses
    ]


def _fetch_plan_invitations(user: dict) -> list:
    db = SessionLocal()
    try:
        db_user = get_or_create_user(db, user)
        accesses = (
            db.query(models.SharedPlanAccess)
            .options(
                joinedload(models.SharedPlanAccess.plan).joinedload(models.WorkoutPlan.exercises),
                joinedload(models.SharedPlanAccess.plan).joinedload(models.WorkoutPlan.user),
            )
            .filter(
                models.SharedPlanAccess.friend_id == db_user.id,
                models.SharedPlanAccess.status == "pending",
            )
            .all()
        )
        return [serialize_invitation(a) for a in accesses]
    finally:
        db.close()


@router.get("/invitations/stream")
async def stream_plan_invitations(token: str = Query(...)):
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
            data = await asyncio.to_thread(_fetch_plan_invitations, user)
            sig = str(len(data))
            if sig != last_sig:
                last_sig = sig
                yield {"data": json.dumps(data)}
            await asyncio.sleep(5)

    return EventSourceResponse(generator())


@router.put("/invitations/{access_id}/accept", response_model=schemas.SharedPlanResponse)
def accept_plan_invitation(access_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    db_user = get_or_create_user(db, user)
    access = (
        db.query(models.SharedPlanAccess)
        .options(
            joinedload(models.SharedPlanAccess.plan).joinedload(models.WorkoutPlan.exercises),
            joinedload(models.SharedPlanAccess.plan).joinedload(models.WorkoutPlan.user),
        )
        .filter(
            models.SharedPlanAccess.id == access_id,
            models.SharedPlanAccess.friend_id == db_user.id,
            models.SharedPlanAccess.status == "pending",
        )
        .first()
    )
    if not access:
        raise HTTPException(status_code=404, detail="Inbjudan hittades inte")

    access.status = "accepted"
    db.commit()
    db.refresh(access)

    return schemas.SharedPlanResponse(
        id=access.plan.id,
        name=access.plan.name,
        exercises=access.plan.exercises,
        owner=access.plan.user,
    )


@router.delete("/invitations/{access_id}")
def decline_plan_invitation(access_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    db_user = get_or_create_user(db, user)
    access = db.query(models.SharedPlanAccess).filter(
        models.SharedPlanAccess.id == access_id,
        models.SharedPlanAccess.friend_id == db_user.id,
    ).first()
    if not access:
        raise HTTPException(status_code=404, detail="Inbjudan hittades inte")

    db.delete(access)
    db.commit()
    return {"ok": True}


@router.get("/shared", response_model=list[schemas.SharedPlanResponse])
def get_shared_plans(user=Depends(get_current_user), db: Session = Depends(get_db)):
    db_user = get_or_create_user(db, user)
    accesses = (
        db.query(models.SharedPlanAccess)
        .options(
            joinedload(models.SharedPlanAccess.plan).joinedload(models.WorkoutPlan.exercises),
            joinedload(models.SharedPlanAccess.plan).joinedload(models.WorkoutPlan.user),
        )
        .filter(
            models.SharedPlanAccess.friend_id == db_user.id,
            models.SharedPlanAccess.status == "accepted",
        )
        .all()
    )
    return [
        schemas.SharedPlanResponse(
            id=a.plan.id,
            name=a.plan.name,
            exercises=a.plan.exercises,
            owner=a.plan.user,
        )
        for a in accesses
    ]


@router.delete("/shared/{plan_id}")
def leave_shared_plan(plan_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    db_user = get_or_create_user(db, user)
    access = db.query(models.SharedPlanAccess).filter(
        models.SharedPlanAccess.plan_id == plan_id,
        models.SharedPlanAccess.friend_id == db_user.id,
    ).first()
    if not access:
        raise HTTPException(status_code=404, detail="Delad plan hittades inte")
    db.delete(access)
    db.commit()
    return {"ok": True}


@router.get("/", response_model=list[schemas.WorkoutPlanResponse])
def get_plans(user=Depends(get_current_user), db: Session = Depends(get_db)):
    db_user = get_or_create_user(db, user)
    plans = (
        db.query(models.WorkoutPlan)
        .options(
            joinedload(models.WorkoutPlan.exercises),
            joinedload(models.WorkoutPlan.shared_with).joinedload(models.SharedPlanAccess.friend),
        )
        .filter(models.WorkoutPlan.user_id == db_user.id)
        .order_by(models.WorkoutPlan.position, models.WorkoutPlan.created_at)
        .all()
    )
    return [serialize_plan(p) for p in plans]


@router.put("/reorder")
def reorder_plans(body: dict, user=Depends(get_current_user), db: Session = Depends(get_db)):
    db_user = get_or_create_user(db, user)
    ids: list[int] = body.get("ids", [])
    for i, plan_id in enumerate(ids):
        db.query(models.WorkoutPlan).filter(
            models.WorkoutPlan.id == plan_id,
            models.WorkoutPlan.user_id == db_user.id,
        ).update({"position": i})
    db.commit()
    return {"ok": True}


@router.post("/", response_model=schemas.WorkoutPlanResponse)
def create_plan(plan: schemas.WorkoutPlanCreate, user=Depends(get_current_user), db: Session = Depends(get_db)):
    db_user = get_or_create_user(db, user)

    count = db.query(models.WorkoutPlan).filter(models.WorkoutPlan.user_id == db_user.id).count()
    db_plan = models.WorkoutPlan(user_id=db_user.id, name=plan.name, icon=plan.icon, position=count)
    db.add(db_plan)
    db.flush()

    for i, ex in enumerate(plan.exercises):
        db.add(models.Exercise(plan_id=db_plan.id, name=ex.name, sets=ex.sets, reps=ex.reps, order=i))

    db.commit()
    return serialize_plan(get_plan_with_exercises(db, db_plan.id))


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
    db_plan.icon = plan.icon
    db.query(models.Exercise).filter(models.Exercise.plan_id == plan_id).delete()

    for i, ex in enumerate(plan.exercises):
        db.add(models.Exercise(plan_id=db_plan.id, name=ex.name, sets=ex.sets, reps=ex.reps, order=i))

    db.commit()
    return serialize_plan(get_plan_with_exercises(db, plan_id))


@router.post("/{plan_id}/share")
def share_plan(plan_id: int, body: dict, user=Depends(get_current_user), db: Session = Depends(get_db)):
    db_user = get_or_create_user(db, user)
    friend_id = body.get("friend_id")
    if not friend_id:
        raise HTTPException(status_code=400, detail="friend_id required")

    db_plan = db.query(models.WorkoutPlan).filter(
        models.WorkoutPlan.id == plan_id,
        models.WorkoutPlan.user_id == db_user.id
    ).first()
    if not db_plan:
        raise HTTPException(status_code=404, detail="Plan hittades inte")

    friendship = db.query(models.Friendship).filter(
        models.Friendship.status == "accepted",
        (
            (models.Friendship.requester_id == db_user.id) & (models.Friendship.receiver_id == friend_id)
            | (models.Friendship.requester_id == friend_id) & (models.Friendship.receiver_id == db_user.id)
        )
    ).first()
    if not friendship:
        raise HTTPException(status_code=403, detail="Ni är inte vänner")

    existing = db.query(models.SharedPlanAccess).filter(
        models.SharedPlanAccess.plan_id == plan_id,
        models.SharedPlanAccess.friend_id == friend_id,
    ).first()
    if existing:
        return {"ok": True}

    db.add(models.SharedPlanAccess(plan_id=plan_id, friend_id=friend_id, status="pending"))
    db.commit()
    return {"ok": True}


@router.delete("/{plan_id}/share/{friend_id}")
def unshare_plan(plan_id: int, friend_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    db_user = get_or_create_user(db, user)
    access = db.query(models.SharedPlanAccess).join(models.WorkoutPlan).filter(
        models.SharedPlanAccess.plan_id == plan_id,
        models.SharedPlanAccess.friend_id == friend_id,
        models.WorkoutPlan.user_id == db_user.id,
    ).first()
    if not access:
        raise HTTPException(status_code=404, detail="Delning hittades inte")

    db.delete(access)
    db.commit()
    return {"ok": True}


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
