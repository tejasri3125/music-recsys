import { useEffect, useState } from 'react';
import SongCard from '../components/SongCard';
import { getLibrary } from '../api/client';

const PAGE_SIZE = 40;

export default function Library() {
  const [songs, setSongs] = useState([]);
  const [sort, setSort] = useState('popularity');
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [status, setStatus] = useState('loading');

  const loadPage = (newOffset, newSort, replace = false) => {
    setStatus(replace ? 'loading' : 'loading-more');
    getLibrary(newOffset, PAGE_SIZE, newSort)
      .then((data) => {
        setSongs((prev) => (replace ? data.results : [...prev, ...data.results]));
        setTotal(data.total);
        setHasMore(data.has_more);
        setOffset(newOffset + PAGE_SIZE);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  };

  useEffect(() => {
    loadPage(0, sort, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort]);

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 className="section-title display" style={{ margin: 0 }}>
          🎵 Library {total > 0 && <span className="text-muted" style={{ fontSize: '0.9rem', fontWeight: 400 }}>· {total} songs</span>}
        </h2>
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <button
            className={`glass glass-btn ${sort === 'popularity' ? 'glass-btn--accent' : ''}`}
            onClick={() => setSort('popularity')}
            data-cursor-hover
          >
            Most popular
          </button>
          <button
            className={`glass glass-btn ${sort === 'title' ? 'glass-btn--accent' : ''}`}
            onClick={() => setSort('title')}
            data-cursor-hover
          >
            A–Z
          </button>
        </div>
      </div>

      {status === 'error' && (
        <p className="text-secondary" style={{ marginTop: '1.5rem' }}>
          Couldn't reach the backend.
        </p>
      )}

      <div className="song-grid" style={{ marginTop: '1.5rem' }}>
        {songs.map((song) => (
          <SongCard key={song.id} song={song} />
        ))}
      </div>

      {status === 'loading' && (
        <p className="text-secondary" style={{ textAlign: 'center', marginTop: '2rem' }}>
          Loading…
        </p>
      )}

      {hasMore && status !== 'loading' && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
          <button
            className="glass glass-btn glass-btn--accent"
            onClick={() => loadPage(offset, sort)}
            disabled={status === 'loading-more'}
            data-cursor-hover
          >
            {status === 'loading-more' ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  );
}
