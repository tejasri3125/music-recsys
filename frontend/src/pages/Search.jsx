import { useEffect, useState } from 'react';
import SongCard from '../components/SongCard';
import { searchSongs, moodSearch } from '../api/client';

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState('ready');
  const [mode, setMode] = useState('keyword');
  const [moodMeta, setMoodMeta] = useState(null);

  useEffect(() => {
    if (!query) {
      setResults([]);
      setMoodMeta(null);
      return;
    }

    setStatus('loading');
    const timeout = setTimeout(() => {
      const call = mode === 'mood' ? moodSearch(query) : searchSongs(query);

      call
        .then((data) => {
          if (mode === 'mood') {
            setResults(data.results);
            setMoodMeta(data);
          } else {
            setResults(data);
            setMoodMeta(null);
          }
          setStatus('ready');
        })
        .catch(() => setStatus('error'));
    }, 300);

    return () => clearTimeout(timeout);
  }, [query, mode]);

  return (
    <div className="page">
      <h2 className="section-title display">Search</h2>

      <div className="search-toggle-group">
        <button
          className={`glass glass-btn ${mode === 'keyword' ? 'glass-btn--accent' : ''}`}
          onClick={() => setMode('keyword')}
          data-cursor-hover
        >
          By title/artist
        </button>
        <button
          className={`glass glass-btn ${mode === 'mood' ? 'glass-btn--accent' : ''}`}
          onClick={() => setMode('mood')}
          data-cursor-hover
        >
          By mood ✨
        </button>
      </div>

      <div className="search-bar-wrapper">
        <span className="search-icon">🔍</span>
        <input
          className="search-bar"
          type="text"
          placeholder={
            mode === 'mood'
              ? 'e.g. "upbeat songs for a workout"'
              : 'Search by song or artist…'
          }
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </div>

      {moodMeta && (
        <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.6rem' }}>
          {moodMeta.mode === 'mood_filtered'
            ? '✨ Matched by mood/activity keywords'
            : 'No mood keywords recognized — fell back to keyword search'}
        </p>
      )}

      <h2 className="section-title display">
        {query ? `Results for "${query}"` : 'Start typing to search'}
      </h2>

      {status === 'error' && (
        <p className="text-secondary">Couldn't reach the backend.</p>
      )}

      <div className="song-grid">
        {results.map((song) => (
          <SongCard key={song.id} song={song} />
        ))}
      </div>
    </div>
  );
}
