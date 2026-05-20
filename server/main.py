from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from database import engine, Base
from routers import plans, logs, goals, friends, social, shared_goals, notifications, users


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    with engine.connect() as conn:
        conn.execute(text(
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS "
            "show_overload_hints BOOLEAN NOT NULL DEFAULT FALSE"
        ))
        conn.execute(text(
            "ALTER TABLE workout_plans ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0"
        ))
        conn.commit()
    yield


app = FastAPI(title="SetTrackr API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(plans.router)
app.include_router(logs.router)
app.include_router(goals.router)
app.include_router(friends.router)
app.include_router(social.router)
app.include_router(shared_goals.router)
app.include_router(notifications.router)
app.include_router(users.router)


@app.get("/")
def root():
    return {"message": "SetTrackr API is running"}
