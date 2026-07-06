import { useEffect, useState } from 'react';
import SongCard from '../components/SongCard';
import { getTrending, getForYou } from '../api/client';

const GREETINGS = ['Welcome back', 'Good to see you', 'Ready for something new?'];

export default function Home() {
  const [trending, setTrending] = useState([]);
  const [forYou, setForYou] = useState([]);
  const [status, setStatus] = useState('loading');
  const [greeting] = useState(() => GREETINGS[Math.floor(Math.random() * GREETINGS.length)]);

  useEffect(() => {
    Promise.all([getTrending(), getForYou()])
      .then(([trendingData, forYouData]) => {
        setTrending(trendingData.trending);
        setForYou(forYouData);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, []);

  if (status === 'loading') {
    return <div className="page text-secondary">Loading your feed…</div>;
  }

  if (status === 'error') {
    return (
      <div className="page text-secondary">
        Couldn't reach the backend. Make sure the FastAPI server is running
        on <code>localhost:8000</code>.
      </div>
    );
  }

  const isColdStart = forYou.length > 0 && !forYou[0].reason;

  return (
    <div className="page">
      <div className="glass home-banner">
        <div>
          <p className="home-banner__eyebrow">{greeting}</p>
          <h1 className="home-banner__title">What are we listening to today?</h1>
        </div>
      </div>

      <div className="section-header">
        <span className="section-header__badge">🔥</span>
        <h2 className="section-title display">Trending now</h2>
      </div>
      <div className="song-grid">
        {trending.map((song) => (
          <SongCard key={song.id} song={song} />
        ))}
      </div>

      <div className="section-header">
        <span className="section-header__badge">✨</span>
        <h2 className="section-title display">For you</h2>
      </div>
      {isColdStart && (
        <p className="text-muted" style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
          Like a few songs and this section will start matching your taste —
          right now it's just showing popular picks since you're new here.
        </p>
      )}
      <div className="song-grid">
        {forYou.map((song) => (
          <SongCard key={song.id} song={song} />
        ))}
      </div>
    </div>
  );
}
