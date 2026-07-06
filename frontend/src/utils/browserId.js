/**
 * Anonymous per-browser identity. No login, no accounts — just a random
 * UUID generated once and stored in localStorage, so this browser's
 * likes/dislikes persist across visits and power the hybrid recommender.
 *
 * This is intentionally NOT a real auth system — it's per-device, not
 * per-person, and anyone can clear localStorage to reset it. That's a
 * fair tradeoff for a project with no login UI.
 */
const STORAGE_KEY = 'music_recsys_browser_id';

export function getBrowserId() {
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}
