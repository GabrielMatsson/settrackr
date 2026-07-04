import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from database import engine, Base
from routers import plans, logs, goals, friends, notifications, users, admin


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
        conn.execute(text("DROP TABLE IF EXISTS workout_reactions CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS workout_comments CASCADE"))
        conn.commit()
    yield


app = FastAPI(title="SetTrackr API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGIN", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(plans.router)
app.include_router(logs.router)
app.include_router(goals.router)
app.include_router(friends.router)
app.include_router(notifications.router)
app.include_router(users.router)
app.include_router(admin.router)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):  # noqa: ARG001
    allowed_origins = os.getenv("ALLOWED_ORIGIN", "http://localhost:3000").split(",")
    origin = request.headers.get("origin", "")
    cors_origin = origin if origin in allowed_origins else allowed_origins[0]
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
        headers={"Access-Control-Allow-Origin": cors_origin},
    )


@app.get("/")
def root():
    return {"message": "SetTrackr API is running"}
