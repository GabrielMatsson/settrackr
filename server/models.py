from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String)
    weekly_goal = Column(Integer, nullable=True)
    show_overload_hints = Column(Boolean, nullable=False, default=False, server_default="0")
    show_chicken_legs   = Column(Boolean, nullable=False, default=False, server_default="0")
    show_gym_ghost      = Column(Boolean, nullable=False, default=False, server_default="0")
    show_gym_mascot     = Column(Boolean, nullable=False, default=False, server_default="0")
    show_food_mascot    = Column(Boolean, nullable=False, default=False, server_default="0")
    # Feature toggles — default ON (the user opts OUT). show_food_tracking gates
    # the whole Kost section; the two coach flags gate each Coach tab.
    show_training_coach  = Column(Boolean, nullable=False, default=True, server_default="1")
    show_nutrition_coach = Column(Boolean, nullable=False, default=True, server_default="1")
    show_food_tracking   = Column(Boolean, nullable=False, default=True, server_default="1")
    show_weight_tracking = Column(Boolean, nullable=False, default=True, server_default="1")
    kcal_target = Column(Integer, nullable=True)
    protein_target = Column(Integer, nullable=True)
    target_weight = Column(Float, nullable=True)  # body weight goal, kg
    goal_mode = Column(String, nullable=True)     # "deff" | "maintain" | "bulk"

    plans = relationship("WorkoutPlan", back_populates="user", cascade="all, delete-orphan")
    logs = relationship("WorkoutLog", back_populates="user", cascade="all, delete-orphan")
    goals = relationship("Goal", back_populates="user", cascade="all, delete-orphan")
    meals = relationship("Meal", back_populates="user", cascade="all, delete-orphan")
    exercise_muscles = relationship("ExerciseMuscle", back_populates="user", cascade="all, delete-orphan")
    weight_logs = relationship("WeightLog", back_populates="user", cascade="all, delete-orphan")
    favorite_meals = relationship("FavoriteMeal", back_populates="user", cascade="all, delete-orphan")


class Friendship(Base):
    __tablename__ = "friendships"

    id = Column(Integer, primary_key=True)
    requester_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String, default="pending")

    requester = relationship("User", foreign_keys=[requester_id])
    receiver = relationship("User", foreign_keys=[receiver_id])


class WorkoutPlan(Base):
    __tablename__ = "workout_plans"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    icon = Column(String, default="Dumbbell")
    copied_from_name = Column(String, nullable=True)
    position = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="plans")
    exercises = relationship("Exercise", back_populates="plan", cascade="all, delete-orphan", order_by="Exercise.order")
    shared_with = relationship("SharedPlanAccess", back_populates="plan", cascade="all, delete-orphan")


class Exercise(Base):
    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True)
    plan_id = Column(Integer, ForeignKey("workout_plans.id"), nullable=False)
    name = Column(String, nullable=False)
    sets = Column(Integer, nullable=False)
    reps = Column(Integer, nullable=False)
    order = Column(Integer, default=0)

    plan = relationship("WorkoutPlan", back_populates="exercises")


class Goal(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    target_weight = Column(Float, nullable=False)

    user = relationship("User", back_populates="goals")


class ExerciseMuscle(Base):
    __tablename__ = "exercise_muscles"
    __table_args__ = (UniqueConstraint("user_id", "name"),)

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)      # exercise name as typed
    muscles = Column(String, nullable=False)   # comma-separated canonical slugs

    user = relationship("User", back_populates="exercise_muscles")


class WorkoutLog(Base):
    __tablename__ = "workout_logs"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    plan_name = Column(String, nullable=False)
    icon = Column(String, default="Dumbbell")
    date = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="logs")
    exercises = relationship("ExerciseLog", back_populates="log", cascade="all, delete-orphan")


class ExerciseLog(Base):
    __tablename__ = "exercise_logs"

    id = Column(Integer, primary_key=True)
    log_id = Column(Integer, ForeignKey("workout_logs.id"), nullable=False)
    name = Column(String, nullable=False)
    sets = Column(Integer, nullable=False)
    reps = Column(Integer, nullable=False)
    weight = Column(Float, nullable=False)  # extra load in kg (on top of body weight when is_bodyweight)
    difficulty = Column(String, nullable=False)
    done = Column(Boolean, nullable=False)
    is_bodyweight = Column(Boolean, nullable=False, default=False, server_default="0")

    log = relationship("WorkoutLog", back_populates="exercises")



class WeightLog(Base):
    __tablename__ = "weight_logs"
    __table_args__ = (UniqueConstraint("user_id", "date"),)

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(String, nullable=False)      # ISO "YYYY-MM-DD"
    weight_kg = Column(Float, nullable=False)

    user = relationship("User", back_populates="weight_logs")


class Meal(Base):
    __tablename__ = "meals"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(String, nullable=False)
    title = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="meals")
    items = relationship("MealItem", back_populates="meal", cascade="all, delete-orphan")


class MealItem(Base):
    __tablename__ = "meal_items"

    id = Column(Integer, primary_key=True)
    meal_id = Column(Integer, ForeignKey("meals.id"), nullable=False)
    name = Column(String, nullable=False)
    brand = Column(String, nullable=True)
    barcode = Column(String, nullable=True)
    grams = Column(Float, nullable=False)
    kcal_100g = Column(Float, nullable=False)
    protein_100g = Column(Float, nullable=False)
    carbs_100g = Column(Float, nullable=False)
    fat_100g = Column(Float, nullable=False)

    meal = relationship("Meal", back_populates="items")


class FavoriteMeal(Base):
    __tablename__ = "favorite_meals"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    # JSON-serialized list of item dicts (name/brand/barcode/grams/*_100g) — a
    # reusable snapshot, decoupled from any dated Meal so it survives deletion.
    items_json = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="favorite_meals")


class SharedPlanAccess(Base):
    __tablename__ = "shared_plan_access"
    __table_args__ = (UniqueConstraint("plan_id", "friend_id"),)

    id = Column(Integer, primary_key=True)
    plan_id = Column(Integer, ForeignKey("workout_plans.id"), nullable=False)
    friend_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String, default="pending")  # "pending" or "accepted"
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    plan = relationship("WorkoutPlan", back_populates="shared_with")
    friend = relationship("User")
