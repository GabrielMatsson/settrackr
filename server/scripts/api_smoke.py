"""Reusable local API test harness.

Mints a JWT the same way the frontend's /api/auth/token route does (HS256 with
AUTH_SECRET from server/.env), so any endpoint can be exercised against a
locally running uvicorn without going through Google login.

Usage:
    1. Start the server:  venv\\Scripts\\activate && uvicorn main:app --port 8000
       (or from another shell: Start-Process venv\\Scripts\\python.exe -ArgumentList "-m","uvicorn","main:app","--port","8000")
    2. Run checks:        venv\\Scripts\\python.exe scripts\\api_smoke.py
    3. Or import from a scratch script:
           from scripts.api_smoke import call
           print(call("GET", "/users/me"))

By default runs a read-only smoke pass (/, /users/me, /logs/, /plans/, /goals/,
/food/?date=today). Write-path tests should create + delete their own data.
"""
import os
import sys
import json
import datetime
import urllib.request
import urllib.error

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))
from jose import jwt

BASE = os.environ.get("SMOKE_BASE_URL", "http://localhost:8000")
EMAIL = os.environ.get("SMOKE_EMAIL", "matssongabriel@gmail.com")

_token = jwt.encode({"sub": EMAIL, "name": "Smoke Test"}, os.environ["AUTH_SECRET"], algorithm="HS256")
_headers = {"Authorization": f"Bearer {_token}", "Content-Type": "application/json"}


def call(method: str, path: str, body=None):
    """Call the local API with an authenticated request. Returns parsed JSON."""
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(BASE + path, data=data, headers=_headers, method=method)
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())


def main():
    today = datetime.date.today().isoformat()
    checks = [
        ("GET", "/", None),
        ("GET", "/users/me", None),
        ("GET", "/logs/", None),
        ("GET", "/plans/", None),
        ("GET", "/goals/", None),
        ("GET", f"/food/?date={today}", None),
    ]
    failed = 0
    for method, path, body in checks:
        try:
            result = call(method, path, body)
            size = len(result) if isinstance(result, list) else "ok"
            print(f"  PASS {method} {path} -> {size}")
        except urllib.error.URLError as e:
            print(f"  FAIL {method} {path} -> {e}")
            failed += 1
    if failed:
        print(f"{failed} check(s) failed. Is uvicorn running on {BASE}?")
        sys.exit(1)
    print("All smoke checks passed.")


if __name__ == "__main__":
    main()
