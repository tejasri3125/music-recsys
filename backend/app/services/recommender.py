"""
Real hybrid recommender, built from actual like/dislike behavior:

1. CONTENT-BASED part: average the audio-feature vector of everything a
   browser has liked, then find songs whose vectors are closest to that
   "taste profile" via cosine similarity.

2. COLLABORATIVE part: find *other* anonymous browsers who liked any of
   the same songs, then recommend what THEY liked that this browser
   hasn't seen yet. This is genuine item/user co-occurrence collaborative
   filtering — it just uses anonymous browser IDs instead of real user
   accounts, which is honest for a project with no login system.

The two scores are blended. With very few interactions (a fresh browser,
or few people having tried the demo yet), the collaborative part
naturally contributes little — that's expected, not a bug. It gets
stronger as more browsers use the app and tastes start to overlap.
"""
import numpy as np
from app.data.real_songs import SONGS
from app.services import db

FEATURE_KEYS = ["danceability", "energy", "valence", "tempo"]

_SONGS_BY_ID = {s["id"]: s for s in SONGS}


def _feature_vector(song: dict) -> np.ndarray:
    vec = np.array([song[k] for k in FEATURE_KEYS], dtype=float)
    vec[FEATURE_KEYS.index("tempo")] = (vec[FEATURE_KEYS.index("tempo")] - 60) / 100
    return vec


def _cosine(a: np.ndarray, b: np.ndarray) -> float:
    denom = np.linalg.norm(a) * np.linalg.norm(b)
    return float(a @ b / denom) if denom > 0 else 0.0


def get_recommendations(browser_id: str, top_n: int = 12) -> list[dict]:
    liked_ids = set(db.get_likes(browser_id))
    disliked_ids = set(db.get_dislikes(browser_id))
    seen_ids = liked_ids | disliked_ids

    # Cold start: no interactions yet — just return popular songs so the
    # page isn't empty. This is the honest, expected behavior, not a bug.
    if not liked_ids:
        pool = [s for s in SONGS if s["id"] not in seen_ids]
        return sorted(pool, key=lambda s: s["popularity"], reverse=True)[:top_n]

    # ---- Content-based score: distance from the "taste profile" ----
    liked_vectors = [_feature_vector(_SONGS_BY_ID[sid]) for sid in liked_ids if sid in _SONGS_BY_ID]
    profile = np.mean(liked_vectors, axis=0)

    content_scores: dict[int, float] = {}
    for song in SONGS:
        if song["id"] in seen_ids:
            continue
        content_scores[song["id"]] = _cosine(profile, _feature_vector(song))

    # ---- Collaborative score: what similar anonymous browsers liked ----
    similar_browsers = db.get_other_browsers_who_liked(list(liked_ids), browser_id)
    co_occurrence = db.get_liked_songs_for_browsers(similar_browsers)
    max_freq = max((freq for _, freq in co_occurrence), default=1)
    collab_scores = {
        sid: freq / max_freq
        for sid, freq in co_occurrence
        if sid not in seen_ids
    }

    # ---- Blend: 65% content, 35% collaborative (collaborative naturally
    # contributes ~0 when there's no overlapping data yet — cold start) ----
    all_candidate_ids = set(content_scores) | set(collab_scores)
    blended = []
    for sid in all_candidate_ids:
        c_score = content_scores.get(sid, 0.0)
        collab_score = collab_scores.get(sid, 0.0)
        final_score = 0.65 * c_score + 0.35 * collab_score
        song = dict(_SONGS_BY_ID[sid])
        song["match_score"] = round(final_score, 3)
        song["reason"] = (
            "Others with similar taste also liked this"
            if collab_score > c_score
            else "Matches your listening profile"
        )
        blended.append(song)

    blended.sort(key=lambda s: s["match_score"], reverse=True)
    return blended[:top_n]
