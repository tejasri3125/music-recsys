"""
Content-based recommender — cosine similarity on audio features.
Used for "similar songs" on the Song Detail page (not personalized —
that's recommender.py's job). This one just answers "what sounds like
this specific song."
"""
import numpy as np
from app.data.real_songs import SONGS

FEATURE_KEYS = ["danceability", "energy", "valence", "tempo"]


def _feature_matrix():
    raw = np.array([[s[k] for k in FEATURE_KEYS] for s in SONGS], dtype=float)
    raw[:, FEATURE_KEYS.index("tempo")] = (raw[:, FEATURE_KEYS.index("tempo")] - 60) / 100
    return raw


def get_similar_songs(song_id: int, top_n: int = 5):
    matrix = _feature_matrix()
    ids = [s["id"] for s in SONGS]

    if song_id not in ids:
        return []

    idx = ids.index(song_id)
    target = matrix[idx]

    norms = np.linalg.norm(matrix, axis=1)
    target_norm = np.linalg.norm(target)
    sims = matrix @ target / (norms * target_norm + 1e-9)

    ranked = sorted(
        [(i, score) for i, score in enumerate(sims) if i != idx],
        key=lambda x: x[1],
        reverse=True,
    )[:top_n]

    results = []
    for i, score in ranked:
        song = SONGS[i]
        results.append({
            **song,
            "similarity": round(float(score), 3),
            "reason": _explain(SONGS[idx], song),
        })
    return results


def _explain(source, match):
    if abs(source["energy"] - match["energy"]) < 0.1:
        return f"Similar energy to {source['title']}"
    if abs(source["valence"] - match["valence"]) < 0.1:
        return f"Similar mood to {source['title']}"
    if source["artist"] == match["artist"]:
        return f"Also by {source['artist']}"
    return f"Recommended because you liked {source['title']}"
