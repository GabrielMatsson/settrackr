from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("AUTH_SECRET")
ALGORITHM = "HS256"

# Fail fast at boot — with no secret every request would 500 with a confusing
# decode error, and tokens could never validate anyway.
if not SECRET_KEY:
    raise RuntimeError("AUTH_SECRET environment variable is not set")

security = HTTPBearer()


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"email": email, "name": payload.get("name")}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


def decode_stream_token(token: str) -> dict:
    """Validate a JWT passed as an SSE query parameter (EventSource can't set
    headers). Returns the decoded payload — including `exp`, which stream
    generators use to end the stream when the token expires — or raises 401."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    if not payload.get("sub"):
        raise HTTPException(status_code=401, detail="Invalid token")
    return payload
