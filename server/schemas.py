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
    exercises: list[ExerciseCreate]

class WorkoutPlanResponse(BaseModel):
    id: int
    name: str
    exercises: list[ExerciseResponse]

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
    date: str
    exercises: list[ExerciseLogCreate]

class WorkoutLogResponse(BaseModel):
    id: int
    plan_name: str
    date: str
    exercises: list[ExerciseLogResponse]

    model_config = {"from_attributes": True}
