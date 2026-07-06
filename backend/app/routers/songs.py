from fastapi import APIRouter, HTTPException
from app.data.real_songs import SONGS
from app.services.itunes_service import find_preview

router = APIRouter(prefix="/api/songs", tags=["songs"])


@router.get("/library")
def browse_library(offset: int = 0, limit: int = 40, sort: str = "popularity"):
    """
    Paginated full-catalog browse — separate from search since it needs
    to page through everything, not just return matches. `sort` can be
    'popularity' or 'title'.
    """
    if sort == "title":
        ordered = sorted(SONGS, key=lambda s: s["title"].lower())
    else:
        ordered = sorted(SONGS, key=lambda s: s["popularity"], reverse=True)

    page = ordered[offset:offset + limit]
    return {
        "results": page,
        "total": len(SONGS),
        "has_more": offset + limit < len(SONGS),
    }


@router.get("")
def search_songs(q: str = "", limit: int = 60):
    """Search by title or artist. Empty query returns a capped slice
    (this dataset has 3000 songs — never dump all of them unfiltered)."""
    if not q:
        return SONGS[:limit]
    q_lower = q.lower()
    results = [
        s for s in SONGS
        if q_lower in s["title"].lower() or q_lower in s["artist"].lower()
    ]
    return results[:limit]


@router.get("/{song_id}")
def get_song(song_id: int):
    song = next((s for s in SONGS if s["id"] == song_id), None)
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")
    return song


@router.get("/{song_id}/preview")
async def get_preview(song_id: int):
    song = next((s for s in SONGS if s["id"] == song_id), None)
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")

    result = await find_preview(song["title"], song["artist"])
    if result is None:
        return {"preview_url": None, "image_url": None, "view_url": None}
    return result
