from datetime import date as date_type

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
from crud import get_or_create_user
import models
import schemas

router = APIRouter(prefix="/weight", tags=["weight"])


@router.get("/", response_model=list[schemas.WeightLogResponse])
def get_weight_logs(user=Depends(get_current_user), db: Session = Depends(get_db)):
    db_user = get_or_create_user(db, user)
    return (
        db.query(models.WeightLog)
        .filter(models.WeightLog.user_id == db_user.id)
        .order_by(models.WeightLog.date.desc())
        .all()
    )


@router.post("/", response_model=schemas.WeightLogResponse)
def log_weight(entry: schemas.WeightLogCreate, user=Depends(get_current_user), db: Session = Depends(get_db)):
    db_user = get_or_create_user(db, user)

    try:
        date_type.fromisoformat(entry.date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Ogiltigt datum")
    if not (20 <= entry.weight_kg <= 400):
        raise HTTPException(status_code=400, detail="Vikten måste vara mellan 20 och 400 kg")

    # One entry per date — logging the same date again overwrites it
    db_entry = db.query(models.WeightLog).filter(
        models.WeightLog.user_id == db_user.id,
        models.WeightLog.date == entry.date,
    ).first()
    if db_entry:
        db_entry.weight_kg = entry.weight_kg
    else:
        db_entry = models.WeightLog(user_id=db_user.id, date=entry.date, weight_kg=entry.weight_kg)
        db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry


@router.delete("/{entry_id}")
def delete_weight_log(entry_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    db_user = get_or_create_user(db, user)
    db_entry = db.query(models.WeightLog).filter(
        models.WeightLog.id == entry_id,
        models.WeightLog.user_id == db_user.id,
    ).first()

    if not db_entry:
        raise HTTPException(status_code=404, detail="Weight entry not found")

    db.delete(db_entry)
    db.commit()
    return {"ok": True}
