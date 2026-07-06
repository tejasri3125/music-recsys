"""
SQLite storage for per-browser like/dislike interactions.
No user accounts — each browser gets a random UUID (generated client-side,
stored in localStorage) that acts as an anonymous user ID. This is what
lets us build a real hybrid recommender without needing login/auth.

Security note: every query below uses parameterized placeholders (?),
never string formatting — this is what prevents SQL injection regardless
of what a browser_id or song_id value contains.
"""
import sqlite3
import os
import re

DB_PATH = os.path.join(os.path.dirname(__file__), "app_data.db")

# A browser_id must look like a UUID — anything else is rejected before
# it ever reaches a query. This blocks malformed/malicious input at the
# door rather than relying on the database layer alone.
UUID_RE = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", re.IGNORECASE
)


def is_valid_browser_id(browser_id: str) -> bool:
    return bool(browser_id) and bool(UUID_RE.match(browser_id))


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_connection()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS interactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            browser_id TEXT NOT NULL,
            song_id INTEGER NOT NULL,
            type TEXT NOT NULL CHECK(type IN ('like', 'dislike')),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(browser_id, song_id)
        )
    """)
    conn.execute("CREATE INDEX IF NOT EXISTS idx_browser ON interactions(browser_id)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_song ON interactions(song_id)")
    conn.commit()
    conn.close()


def upsert_interaction(browser_id: str, song_id: int, interaction_type: str):
    """One row per (browser, song) — liking then disliking replaces the row."""
    conn = get_connection()
    conn.execute(
        """
        INSERT INTO interactions (browser_id, song_id, type)
        VALUES (?, ?, ?)
        ON CONFLICT(browser_id, song_id)
        DO UPDATE SET type = excluded.type, created_at = CURRENT_TIMESTAMP
        """,
        (browser_id, song_id, interaction_type),
    )
    conn.commit()
    conn.close()


def get_likes(browser_id: str) -> list[int]:
    conn = get_connection()
    rows = conn.execute(
        "SELECT song_id FROM interactions WHERE browser_id = ? AND type = 'like'",
        (browser_id,),
    ).fetchall()
    conn.close()
    return [r["song_id"] for r in rows]


def get_dislikes(browser_id: str) -> list[int]:
    conn = get_connection()
    rows = conn.execute(
        "SELECT song_id FROM interactions WHERE browser_id = ? AND type = 'dislike'",
        (browser_id,),
    ).fetchall()
    conn.close()
    return [r["song_id"] for r in rows]


def get_other_browsers_who_liked(song_ids: list[int], exclude_browser_id: str) -> list[str]:
    """Finds other anonymous browsers who liked any of the given songs —
    the basis of the collaborative-filtering (co-occurrence) signal."""
    if not song_ids:
        return []
    conn = get_connection()
    placeholders = ",".join("?" for _ in song_ids)
    rows = conn.execute(
        f"""
        SELECT DISTINCT browser_id FROM interactions
        WHERE song_id IN ({placeholders}) AND type = 'like' AND browser_id != ?
        """,
        (*song_ids, exclude_browser_id),
    ).fetchall()
    conn.close()
    return [r["browser_id"] for r in rows]


def get_liked_songs_for_browsers(browser_ids: list[str]) -> list[int]:
    """What did those other browsers like, that we can recommend back?"""
    if not browser_ids:
        return []
    conn = get_connection()
    placeholders = ",".join("?" for _ in browser_ids)
    rows = conn.execute(
        f"""
        SELECT song_id, COUNT(*) as freq FROM interactions
        WHERE browser_id IN ({placeholders}) AND type = 'like'
        GROUP BY song_id
        ORDER BY freq DESC
        """,
        browser_ids,
    ).fetchall()
    conn.close()
    return [(r["song_id"], r["freq"]) for r in rows]
