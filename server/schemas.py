from pydantic import BaseModel
from datetime import datetime

class ExerciseCreate(BaseModel):
    name: str
    sets: int
    reps: int

class ExerciseResponse(ExerciseCreate):
    id: int

    model_config = {"from_attributes": True}


class WorkoutPlanCreate(BaseModel):
    name: str
    icon: str = "Dumbbell"
    exercises: list[ExerciseCreate]

class SharedAccessSummary(BaseModel):
    id: int
    friend: "UserPublicResponse"
    status: str

class WorkoutPlanResponse(BaseModel):
    id: int
    name: str
    icon: str = "Dumbbell"
    copied_from_name: str | None = None
    position: int = 0
    exercises: list[ExerciseResponse]
    shared_with: list[SharedAccessSummary] = []

    model_config = {"from_attributes": True}

class SharedPlanResponse(BaseModel):
    id: int
    name: str
    exercises: list[ExerciseResponse]
    owner: "UserPublicResponse"

    model_config = {"from_attributes": True}

class PlanInvitationResponse(BaseModel):
    id: int
    plan_id: int
    plan_name: str
    exercises: list[ExerciseResponse]
    from_user: "UserPublicResponse"


class GoalCreate(BaseModel):
    name: str
    target_weight: float

class GoalResponse(GoalCreate):
    id: int

    model_config = {"from_attributes": True}


class UserPublicResponse(BaseModel):
    id: int
    name: str | None
    email: str

    model_config = {"from_attributes": True}

class UserProfileResponse(BaseModel):
    name: str | None
    email: str
    weekly_goal: int = 3
    show_overload_hints: bool = False

    model_config = {"from_attributes": True}

class UserProfileUpdate(BaseModel):
    name: str | None = None
    weekly_goal: int | None = None
    show_overload_hints: bool | None = None

class FriendshipResponse(BaseModel):
    id: int
    status: str
    friend: UserPublicResponse

    model_config = {"from_attributes": True}


class ExerciseLogCreate(BaseModel):
    name: str
    sets: int
    reps: int
    weight: float
    difficulty: str
    done: bool

class ExerciseLogResponse(ExerciseLogCreate):
    id: int

    model_config = {"from_attributes": True}


class WorkoutLogCreate(BaseModel):
    plan_name: str
    icon: str = "Dumbbell"
    date: str
    exercises: list[ExerciseLogCreate]

class WorkoutLogResponse(BaseModel):
    id: int
    plan_name: str
    icon: str = "Dumbbell"
    date: str
    exercises: list[ExerciseLogResponse]

    model_config = {"from_attributes": True}

class WorkoutLogWithReactionsResponse(WorkoutLogResponse):
    reaction_count: int = 0
    liked_by_me: bool = False
    comments: list["CommentResponse"] = []


class CommentAuthor(BaseModel):
    id: int
    name: str | None
    email: str

    model_config = {"from_attributes": True}

class CommentResponse(BaseModel):
    id: int
    body: str
    created_at: datetime
    author: CommentAuthor

    model_config = {"from_attributes": True}


class LevelResponse(BaseModel):
    xp: int
    level: int
    title: str
    current_threshold: int
    next_threshold: int | None
    next_title: str | None
    progress_pct: float


class SharedGoalCreate(BaseModel):
    friend_id: int
    exercise_name: str
    target_weight: float

class SharedGoalResponse(BaseModel):
    id: int
    exercise_name: str
    target_weight: float
    owner: "UserPublicResponse"
    friend: "UserPublicResponse"
    owner_best: float
    friend_best: float

    model_config = {"from_attributes": True}
