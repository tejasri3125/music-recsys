"""
Loads songs from a CSV at startup — no manual regeneration step needed.
Just drop a differently-shaped CSV at the path below and restart the
server; column names are auto-detected from common variants.

To swap datasets: replace the file at CSV_PATH (or set the CSV_PATH env
var to point elsewhere), then restart the backend. That's it.
"""
import os
import pandas as pd

CSV_PATH = os.getenv(
    "CSV_PATH",
    os.path.join(os.path.dirname(__file__), "spotify_tracks.csv"),
)
MAX_SONGS = int(os.getenv("MAX_SONGS", "3000"))

# Each target field -> list of column names we'll accept, checked in order,
# case-insensitively. Add more variants here if a new CSV uses different
# naming and it still doesn't match.
COLUMN_ALIASES = {
    "title": ["track_name", "title", "name", "song_name", "song"],
    "artist": ["artist_name", "artist", "artists", "singer", "performer"],
    "album": ["album_name", "album"],
    "image_url": ["artwork_url", "image_url", "cover_url", "album_art", "art_url"],
    "genre": ["track_genre", "genre", "genres", "category"],
    "danceability": ["danceability"],
    "energy": ["energy"],
    "valence": ["valence"],
    "tempo": ["tempo", "bpm"],
    "popularity": ["popularity", "popularity_score"],
}

REQUIRED_FIELDS = ["title", "artist", "danceability", "energy", "valence", "tempo", "popularity"]

# Minimal built-in fallback so the app never crashes to a blank screen
# if no CSV is present at all (e.g. first-time setup before downloading one).
_FALLBACK_SONGS = [
    {"id": 1, "title": "Sample Track", "artist": "Demo Artist", "album": "Demo Album",
     "genre": "Unknown", "danceability": 0.6, "energy": 0.5, "valence": 0.5,
     "tempo": 100, "popularity": 50, "image_url": None},
]


def _find_column(df: pd.DataFrame, candidates: list) -> str | None:
    lower_map = {c.lower(): c for c in df.columns}
    for candidate in candidates:
        if candidate.lower() in lower_map:
            return lower_map[candidate.lower()]
    return None


def _load_songs() -> list:
    if not os.path.exists(CSV_PATH):
        print(f"[real_songs] No CSV found at {CSV_PATH} — using tiny fallback dataset.")
        return _FALLBACK_SONGS

    df = pd.read_csv(CSV_PATH)

    resolved = {}
    missing = []
    for field, candidates in COLUMN_ALIASES.items():
        col = _find_column(df, candidates)
        if col:
            resolved[field] = col
        elif field in REQUIRED_FIELDS:
            missing.append(field)

    if missing:
        print(f"[real_songs] CSV at {CSV_PATH} is missing required columns: {missing}. "
              f"Found columns: {list(df.columns)}. Using fallback dataset instead.")
        return _FALLBACK_SONGS

    # Build a clean dataframe with our standard field names
    clean = pd.DataFrame()
    for field, col in resolved.items():
        clean[field] = df[col]
    if "genre" not in clean.columns:
        clean["genre"] = "Unknown"
    if "image_url" not in clean.columns:
        clean["image_url"] = None

    clean = clean.dropna(subset=REQUIRED_FIELDS)
    clean = clean.drop_duplicates(subset=["title", "artist"]).head(MAX_SONGS)
    clean.insert(0, "id", range(1, len(clean) + 1))

    songs = clean.to_dict(orient="records")
    print(f"[real_songs] Loaded {len(songs)} songs from {CSV_PATH}")
    return songs


SONGS = _load_songs()
