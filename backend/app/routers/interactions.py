from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, field_validator
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.services import db
from app.data.real_songs import SONGS

router = APIRouter(prefix="/api/interactions", tags=["interactions"])
limiter = Limiter(key_func=get_remote_address)

_VALID_SONG_IDS = {s["id"] for s in SONGS}


class InteractionIn(BaseModel):
    browser_id: str
    song_id: int
    type: str  # "like" | "dislike"

    @field_validator("browser_id")
    @classmethod
    def browser_id_must_be_uuid(cls, v):
        if not db.is_valid_browser_id(v):
            raise ValueError("browser_id must be a valid UUID")
        return v

    @field_validator("type")
    @classmethod
    def type_must_be_valid(cls, v):
        if v not in ("like", "dislike"):
            raise ValueError("type must be 'like' or 'dislike'")
        return v

    @field_validator("song_id")
    @classmethod
    def song_id_must_exist(cls, v):
        if v not in _VALID_SONG_IDS:
            raise ValueError("song_id does not exist")
        return v


@router.post("")
@limiter.limit("60/minute")  # generous for real use, blocks spam/abuse
def record_interaction(request: Request, payload: InteractionIn):
    db.upsert_interaction(payload.browser_id, payload.song_id, payload.type)
    return {"status": "ok"}


@router.get("/{browser_id}")
@limiter.limit("60/minute")
def list_interactions(request: Request, browser_id: str):
    if not db.is_valid_browser_id(browser_id):
        raise HTTPException(status_code=400, detail="Invalid browser_id")
    return {
        "likes": db.get_likes(browser_id),
        "dislikes": db.get_dislikes(browser_id),
    }
