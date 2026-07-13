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


def get_accepted_friendship(db: Session, user_id: int, friend_id: int) -> models.Friendship | None:
    """The accepted friendship between two users, in either direction."""
    return db.query(models.Friendship).filter(
        models.Friendship.status == "accepted",
        (
            (models.Friendship.requester_id == user_id) & (models.Friendship.receiver_id == friend_id)
            | (models.Friendship.requester_id == friend_id) & (models.Friendship.receiver_id == user_id)
        )
    ).first()
