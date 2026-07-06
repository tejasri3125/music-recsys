"""
iTunes Search API lookup — free, no auth. Spotify blocks preview_url for
new apps as of Nov 2024, so this is the working option for 30-sec previews.
"""
import re
import httpx

SEARCH_URL = "https://itunes.apple.com/search"


def _clean(text: str) -> str:
    text = re.sub(r"\(.*?\)", "", text)
    text = re.sub(r"\[.*?\]", "", text)
    text = re.sub(r"feat\.?.*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\s+", " ", text).strip()
    return text


async def find_preview(title: str, artist: str) -> dict | None:
    clean_title = _clean(title)
    clean_artist = re.split(r"[,&]", _clean(artist))[0].strip()

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(
                SEARCH_URL,
                params={
                    "term": f"{clean_title} {clean_artist}",
                    "entity": "song",
                    "limit": 3,
                },
            )
            resp.raise_for_status()
            results = resp.json().get("results", [])

            if not results:
                return {"preview_url": None, "image_url": None, "view_url": None}

            track = next(
                (r for r in results if clean_title.lower() in r.get("trackName", "").lower()),
                results[0],
            )

            artwork = track.get("artworkUrl100")
            if artwork:
                artwork = artwork.replace("100x100", "600x600")

            return {
                "preview_url": track.get("previewUrl"),
                "image_url": artwork,
                "view_url": track.get("trackViewUrl"),
            }
    except Exception:
        return None
