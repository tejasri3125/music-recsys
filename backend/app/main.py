from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.routers import songs, recommend, interactions, nlsearch
from app.services import db

app = FastAPI(title="Music Recsys API")

# ---- Security: rate limiting ----
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ---- Security: CORS — only allow the actual frontend origins ----
# Add your deployed Cloudflare Pages URL here once you deploy.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)


# ---- Security: basic hardening headers on every response ----
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


@app.on_event("startup")
def startup():
    db.init_db()


app.include_router(songs.router)
app.include_router(recommend.router)
app.include_router(interactions.router)
app.include_router(nlsearch.router)


@app.get("/")
def root():
    return {"status": "Music Recsys API is running"}


@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    # Pydantic validators raise ValueError — return a clean 400 instead
    # of leaking a stack trace to the client.
    return JSONResponse(status_code=400, content={"detail": str(exc)})
