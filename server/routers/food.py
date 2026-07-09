from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload, selectinload
from database import get_db
from auth import get_current_user
from crud import get_or_create_user
import models
import schemas

router = APIRouter(prefix="/food", tags=["food"])


def get_meal_with_items(db: Session, meal_id: int) -> models.Meal | None:
    return (
        db.query(models.Meal)
        .options(joinedload(models.Meal.items))
        .filter(models.Meal.id == meal_id)
        .first()
    )


@router.get("/", response_model=list[schemas.MealResponse])
def get_meals(date: str, user=Depends(get_current_user), db: Session = Depends(get_db)):
    db_user = get_or_create_user(db, user)
    return (
        db.query(models.Meal)
        .options(selectinload(models.Meal.items))
        .filter(models.Meal.user_id == db_user.id, models.Meal.date == date)
        .order_by(models.Meal.created_at)
        .all()
    )


@router.get("/range", response_model=list[schemas.MealResponse])
def get_meals_range(start: str, end: str, user=Depends(get_current_user), db: Session = Depends(get_db)):
    db_user = get_or_create_user(db, user)
    return (
        db.query(models.Meal)
        .options(selectinload(models.Meal.items))
        .filter(
            models.Meal.user_id == db_user.id,
            models.Meal.date >= start,
            models.Meal.date <= end,
        )
        .order_by(models.Meal.date, models.Meal.created_at)
        .all()
    )


@router.get("/items", response_model=list[schemas.FoodHistoryItem])
def get_food_item_history(user=Depends(get_current_user), db: Session = Depends(get_db)):
    # Distinct foods the user has logged before (most recent first), so the
    # meal builder can offer quick re-add via fuzzy search.
    db_user = get_or_create_user(db, user)
    rows = (
        db.query(models.MealItem)
        .join(models.Meal, models.MealItem.meal_id == models.Meal.id)
        .filter(models.Meal.user_id == db_user.id)
        .order_by(models.Meal.date.desc(), models.Meal.created_at.desc(), models.MealItem.id.desc())
        .all()
    )
    seen: set[str] = set()
    result = []
    for r in rows:
        key = r.name.strip().lower()
        if key in seen:
            continue
        seen.add(key)
        result.append({
            "name": r.name,
            "brand": r.brand,
            "grams": r.grams,
            "kcal_100g": r.kcal_100g,
            "protein_100g": r.protein_100g,
            "carbs_100g": r.carbs_100g,
            "fat_100g": r.fat_100g,
        })
        if len(result) >= 100:
            break
    return result


@router.post("/", response_model=schemas.MealResponse)
def create_meal(meal: schemas.MealCreate, user=Depends(get_current_user), db: Session = Depends(get_db)):
    db_user = get_or_create_user(db, user)

    db_meal = models.Meal(user_id=db_user.id, date=meal.date, title=meal.title)
    db.add(db_meal)
    db.flush()

    for item in meal.items:
        db.add(models.MealItem(meal_id=db_meal.id, **item.model_dump()))

    db.commit()
    return get_meal_with_items(db, db_meal.id)


@router.put("/{meal_id}", response_model=schemas.MealResponse)
def update_meal(meal_id: int, meal: schemas.MealCreate, user=Depends(get_current_user), db: Session = Depends(get_db)):
    db_user = get_or_create_user(db, user)
    db_meal = db.query(models.Meal).filter(
        models.Meal.id == meal_id,
        models.Meal.user_id == db_user.id
    ).first()

    if not db_meal:
        raise HTTPException(status_code=404, detail="Meal not found")

    db_meal.title = meal.title
    db_meal.date = meal.date
    db.query(models.MealItem).filter(models.MealItem.meal_id == meal_id).delete()

    for item in meal.items:
        db.add(models.MealItem(meal_id=db_meal.id, **item.model_dump()))

    db.commit()
    return get_meal_with_items(db, meal_id)


@router.delete("/{meal_id}")
def delete_meal(meal_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    db_user = get_or_create_user(db, user)
    db_meal = db.query(models.Meal).filter(
        models.Meal.id == meal_id,
        models.Meal.user_id == db_user.id
    ).first()

    if not db_meal:
        raise HTTPException(status_code=404, detail="Meal not found")

    db.delete(db_meal)
    db.commit()
    return {"ok": True}
