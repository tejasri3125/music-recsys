import { getBrowserId } from '../utils/browserId';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `API error ${res.status}`);
  }
  return res.json();
}

export const getTrending = () => request('/recommend/home');

export const getForYou = () =>
  request(`/recommend/foryou/${getBrowserId()}`);

export const getLibrary = (offset = 0, limit = 40, sort = 'popularity') =>
  request(`/songs/library?offset=${offset}&limit=${limit}&sort=${sort}`);

export const searchSongs = (query) =>
  request(`/songs?q=${encodeURIComponent(query)}`);

export const moodSearch = (query) =>
  request(`/nlsearch?q=${encodeURIComponent(query)}`);

export const getSong = (id) => request(`/songs/${id}`);

export const getRecommendationsFor = (id, topN = 5) =>
  request(`/recommend/${id}?top_n=${topN}`);

export const getPreview = (id) => request(`/songs/${id}/preview`);

export const postInteraction = (songId, type) =>
  request('/interactions', {
    method: 'POST',
    body: JSON.stringify({
      browser_id: getBrowserId(),
      song_id: songId,
      type,
    }),
  });
