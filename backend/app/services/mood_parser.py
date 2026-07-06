"""
Local, deterministic mood parser — no external API, no rate limits,
never fails. Maps mood/activity keywords straight to audio-feature ranges.
"""
import re

MOOD_KEYWORDS = {
    "chill":      {"energy_max": 0.45, "valence_min": 0.3},
    "relax":      {"energy_max": 0.4},
    "relaxing":   {"energy_max": 0.4},
    "calm":       {"energy_max": 0.35},
    "study":      {"energy_max": 0.45, "danceability_max": 0.5},
    "studying":   {"energy_max": 0.45, "danceability_max": 0.5},
    "focus":      {"energy_max": 0.5, "danceability_max": 0.5},
    "sleep":      {"energy_max": 0.25},
    "sad":        {"valence_max": 0.35},
    "melancholy": {"valence_max": 0.3},
    "happy":      {"valence_min": 0.6},
    "good":       {"valence_min": 0.55},
    "upbeat":     {"valence_min": 0.55, "energy_min": 0.55},
    "energetic":  {"energy_min": 0.65},
    "energy":     {"energy_min": 0.6},
    "hype":       {"energy_min": 0.75, "danceability_min": 0.7},
    "party":      {"danceability_min": 0.65, "energy_min": 0.6},
    "dance":      {"danceability_min": 0.65},
    "dancing":    {"danceability_min": 0.65},
    "workout":    {"energy_min": 0.7, "danceability_min": 0.55},
    "gym":        {"energy_min": 0.7, "danceability_min": 0.55},
    "romantic":   {"valence_min": 0.4, "energy_max": 0.55},
    "love":       {"valence_min": 0.45},
    "night":      {"energy_max": 0.5},
    "morning":    {"valence_min": 0.5, "energy_min": 0.45},
    "drive":      {"energy_min": 0.5, "danceability_min": 0.5},
    "driving":    {"energy_min": 0.5, "danceability_min": 0.5},
}


def parse_mood_query(text: str) -> dict | None:
    words = re.findall(r"[a-z]+", text.lower())
    matched = [MOOD_KEYWORDS[w] for w in words if w in MOOD_KEYWORDS]

    if not matched:
        return None

    merged: dict = {}
    for filters in matched:
        for key, value in filters.items():
            if key.endswith("_min"):
                merged[key] = max(merged.get(key, 0), value)
            else:
                merged[key] = min(merged.get(key, 1), value)

    return merged
