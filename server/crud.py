from sqlalchemy.orm import Session
import models

def get_or_create_user(db: Session, user_info: dict) -> models.User:
    user = db.query(models.User).filter(models.User.email == user_info["email"]).first()
    if not user:
        user = models.User(email=user_info["email"], name=user_info.get("name", ""))
        db.add(user)
        db.commit()
        db.refresh(user)
    return user
