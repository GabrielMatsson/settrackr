from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
import models

router = APIRouter(prefix="/admin", tags=["admin"])

ADMIN_EMAIL = "matssongabriel@gmail.com"


def require_admin(user=Depends(get_current_user)):
    if user["email"] != ADMIN_EMAIL:
        raise HTTPException(status_code=403, detail="Forbidden")
    return user


@router.get("/users")
def list_users(db: Session = Depends(get_db), _=Depends(require_admin)):
    users = db.query(models.User).order_by(models.User.id).all()
    return [{"id": u.id, "name": u.name, "email": u.email} for u in users]


@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.email == ADMIN_EMAIL:
        raise HTTPException(status_code=400, detail="Cannot delete admin")
    db.delete(user)
    db.commit()
    return {"ok": True}
