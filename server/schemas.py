from pydantic import BaseModel

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
    show_chicken_legs: bool = False
    show_gym_ghost: bool = False
    show_gym_mascot: bool = False
    show_food_mascot: bool = False
    kcal_target: int = 2200
    protein_target: int = 150

    model_config = {"from_attributes": True}

class UserProfileUpdate(BaseModel):
    name: str | None = None
    weekly_goal: int | None = None
    show_overload_hints: bool | None = None
    show_chicken_legs: bool | None = None
    show_gym_ghost: bool | None = None
    show_gym_mascot: bool | None = None
    show_food_mascot: bool | None = None
    kcal_target: int | None = None
    protein_target: int | None = None

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

class MealItemCreate(BaseModel):
    name: str
    brand: str | None = None
    barcode: str | None = None
    grams: float
    kcal_100g: float
    protein_100g: float
    carbs_100g: float
    fat_100g: float

class MealItemResponse(MealItemCreate):
    id: int

    model_config = {"from_attributes": True}


class MealCreate(BaseModel):
    date: str
    title: str
    items: list[MealItemCreate]

class FoodHistoryItem(BaseModel):
    name: str
    brand: str | None = None
    grams: float
    kcal_100g: float
    protein_100g: float
    carbs_100g: float
    fat_100g: float

class MealResponse(BaseModel):
    id: int
    date: str
    title: str
    items: list[MealItemResponse]

    model_config = {"from_attributes": True}


class LevelResponse(BaseModel):
    xp: int
    level: int
    title: str
    current_threshold: int
    next_threshold: int | None
    next_title: str | None
    progress_pct: float


class ExerciseMuscleCreate(BaseModel):
    name: str
    muscles: list[str]

class ExerciseMuscleResponse(BaseModel):
    id: int
    name: str
    muscles: list[str]


