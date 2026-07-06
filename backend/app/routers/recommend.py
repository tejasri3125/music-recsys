from fastapi import APIRouter, HTTPException
from app.data.real_songs import SONGS
from app.services.content_based import get_similar_songs
from app.services.recommender import get_recommendations
from app.services import db

router = APIRouter(prefix="/api/recommend", tags=["recommend"])


@router.get("/home")
def home_feed():
    """Trending only — the real personalized section lives at /foryou
    and needs a browser_id, since it's built from actual like history."""
    trending = sorted(SONGS, key=lambda s: s["popularity"], reverse=True)[:12]
    return {"trending": trending}


@router.get("/foryou/{browser_id}")
def for_you(browser_id: str, top_n: int = 12):
    """
    Real hybrid recommendations: content-based profile from liked songs,
    blended with collaborative signal from other anonymous browsers who
    liked the same songs. See recommender.py for the actual logic.
    """
    if not db.is_valid_browser_id(browser_id):
        raise HTTPException(status_code=400, detail="Invalid browser_id")
    return get_recommendations(browser_id, top_n=top_n)


@router.get("/{song_id}")
def similar_to_song(song_id: int, top_n: int = 5):
    ids = [s["id"] for s in SONGS]
    if song_id not in ids:
        raise HTTPException(status_code=404, detail="Song not found")
    return get_similar_songs(song_id, top_n=top_n)
