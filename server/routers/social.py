from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from database import get_db
from auth import get_current_user
from crud import get_or_create_user
import models
import schemas

router = APIRouter(tags=["social"])


def get_log_if_accessible(db: Session, log_id: int, db_user: models.User) -> models.WorkoutLog:
    log = db.query(models.WorkoutLog).filter(models.WorkoutLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Loggen hittades inte")

    if log.user_id == db_user.id:
        return log

    friendship = db.query(models.Friendship).filter(
        models.Friendship.status == "accepted",
        (
            (models.Friendship.requester_id == db_user.id) & (models.Friendship.receiver_id == log.user_id)
            | (models.Friendship.requester_id == log.user_id) & (models.Friendship.receiver_id == db_user.id)
        )
    ).first()
    if not friendship:
        raise HTTPException(status_code=403, detail="Åtkomst nekad")

    return log


@router.post("/logs/{log_id}/like")
def toggle_like(log_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    db_user = get_or_create_user(db, user)
    get_log_if_accessible(db, log_id, db_user)

    existing = db.query(models.WorkoutReaction).filter(
        models.WorkoutReaction.log_id == log_id,
        models.WorkoutReaction.user_id == db_user.id,
    ).first()

    if existing:
        db.delete(existing)
        db.commit()
        return {"liked": False}

    db.add(models.WorkoutReaction(log_id=log_id, user_id=db_user.id))
    db.commit()
    return {"liked": True}


@router.get("/logs/{log_id}/comments", response_model=list[schemas.CommentResponse])
def get_comments(log_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    db_user = get_or_create_user(db, user)
    get_log_if_accessible(db, log_id, db_user)

    comments = (
        db.query(models.WorkoutComment)
        .options(joinedload(models.WorkoutComment.user))
        .filter(models.WorkoutComment.log_id == log_id)
        .order_by(models.WorkoutComment.created_at)
        .all()
    )
    return [
        schemas.CommentResponse(
            id=c.id,
            body=c.body,
            created_at=c.created_at,
            author=schemas.CommentAuthor(id=c.user.id, name=c.user.name, email=c.user.email),
        )
        for c in comments
    ]


@router.post("/logs/{log_id}/comments", response_model=schemas.CommentResponse)
def add_comment(log_id: int, body: dict, user=Depends(get_current_user), db: Session = Depends(get_db)):
    db_user = get_or_create_user(db, user)
    get_log_if_accessible(db, log_id, db_user)

    text = (body.get("body") or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Kommentar får inte vara tom")

    comment = models.WorkoutComment(log_id=log_id, user_id=db_user.id, body=text)
    db.add(comment)
    db.commit()
    db.refresh(comment)

    return schemas.CommentResponse(
        id=comment.id,
        body=comment.body,
        created_at=comment.created_at,
        author=schemas.CommentAuthor(id=db_user.id, name=db_user.name, email=db_user.email),
    )


@router.delete("/logs/{log_id}/comments/{comment_id}")
def delete_comment(log_id: int, comment_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    db_user = get_or_create_user(db, user)

    comment = db.query(models.WorkoutComment).filter(
        models.WorkoutComment.id == comment_id,
        models.WorkoutComment.log_id == log_id,
        models.WorkoutComment.user_id == db_user.id,
    ).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Kommentaren hittades inte")

    db.delete(comment)
    db.commit()
    return {"ok": True}
