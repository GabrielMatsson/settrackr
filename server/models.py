from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String)
    weekly_goal = Column(Integer, nullable=True)

    plans = relationship("WorkoutPlan", back_populates="user", cascade="all, delete-orphan")
    logs = relationship("WorkoutLog", back_populates="user", cascade="all, delete-orphan")
    goals = relationship("Goal", back_populates="user", cascade="all, delete-orphan")


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
    copied_from_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="plans")
    exercises = relationship("Exercise", back_populates="plan", cascade="all, delete-orphan")
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


class WorkoutLog(Base):
    __tablename__ = "workout_logs"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    plan_name = Column(String, nullable=False)
    date = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="logs")
    exercises = relationship("ExerciseLog", back_populates="log", cascade="all, delete-orphan")
    reactions = relationship("WorkoutReaction", back_populates="log", cascade="all, delete-orphan")
    comments = relationship("WorkoutComment", back_populates="log", cascade="all, delete-orphan")


class ExerciseLog(Base):
    __tablename__ = "exercise_logs"

    id = Column(Integer, primary_key=True)
    log_id = Column(Integer, ForeignKey("workout_logs.id"), nullable=False)
    name = Column(String, nullable=False)
    sets = Column(Integer, nullable=False)
    reps = Column(Integer, nullable=False)
    weight = Column(Float, nullable=False)
    difficulty = Column(String, nullable=False)
    done = Column(Boolean, nullable=False)

    log = relationship("WorkoutLog", back_populates="exercises")


class WorkoutReaction(Base):
    __tablename__ = "workout_reactions"
    __table_args__ = (UniqueConstraint("log_id", "user_id"),)

    id = Column(Integer, primary_key=True)
    log_id = Column(Integer, ForeignKey("workout_logs.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    log = relationship("WorkoutLog", back_populates="reactions")
    user = relationship("User")


class WorkoutComment(Base):
    __tablename__ = "workout_comments"

    id = Column(Integer, primary_key=True)
    log_id = Column(Integer, ForeignKey("workout_logs.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    body = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    log = relationship("WorkoutLog", back_populates="comments")
    user = relationship("User")


class SharedGoal(Base):
    __tablename__ = "shared_goals"

    id = Column(Integer, primary_key=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    friend_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    exercise_name = Column(String, nullable=False)
    target_weight = Column(Float, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    owner = relationship("User", foreign_keys=[owner_id])
    friend = relationship("User", foreign_keys=[friend_id])


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
