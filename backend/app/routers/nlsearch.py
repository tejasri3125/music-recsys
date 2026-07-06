from fastapi import APIRouter
from app.data.real_songs import SONGS
from app.services.mood_parser import parse_mood_query

router = APIRouter(prefix="/api/nlsearch", tags=["nlsearch"])


@router.get("")
def nl_search(q: str, limit: int = 60):
    filters = parse_mood_query(q)

    if filters:
        results = SONGS
        if "energy_min" in filters:
            results = [s for s in results if s["energy"] >= filters["energy_min"]]
        if "energy_max" in filters:
            results = [s for s in results if s["energy"] <= filters["energy_max"]]
        if "valence_min" in filters:
            results = [s for s in results if s["valence"] >= filters["valence_min"]]
        if "valence_max" in filters:
            results = [s for s in results if s["valence"] <= filters["valence_max"]]
        if "danceability_min" in filters:
            results = [s for s in results if s["danceability"] >= filters["danceability_min"]]
        if "danceability_max" in filters:
            results = [s for s in results if s["danceability"] <= filters["danceability_max"]]
        return {"mode": "mood_filtered", "filters": filters, "results": results[:limit]}

    q_lower = q.lower()
    fallback_results = [
        s for s in SONGS
        if q_lower in s["title"].lower() or q_lower in s["artist"].lower()
    ]
    return {"mode": "keyword_fallback", "results": fallback_results[:limit]}
