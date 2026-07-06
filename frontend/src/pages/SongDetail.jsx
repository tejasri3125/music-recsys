import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import SongCard from '../components/SongCard';
import { getSong, getRecommendationsFor, getPreview } from '../api/client';
import { playPreview, stopCurrent } from '../utils/audioManager';

const GRADIENTS = [
  'linear-gradient(135deg, #FF9466, #E8703D)',
  'linear-gradient(135deg, #7C5CFC, #4C2E8C)',
  'linear-gradient(135deg, #FFB199, #C9536B)',
  'linear-gradient(135deg, #C99BFF, #7C5CFC)',
  'linear-gradient(135deg, #FFB199, #FF9466)',
];

export default function SongDetail() {
  const { id } = useParams();
  const [song, setSong] = useState(null);
  const [recs, setRecs] = useState([]);
  const [status, setStatus] = useState('loading');
  const [playState, setPlayState] = useState('idle'); // idle | loading | playing | unavailable

  useEffect(() => {
    setStatus('loading');
    setPlayState('idle');
    stopCurrent();
    Promise.all([getSong(id), getRecommendationsFor(id)])
      .then(([songData, recsData]) => {
        setSong(songData);
        setRecs(recsData);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, [id]);

  const handlePlay = async () => {
    if (playState === 'playing') {
      stopCurrent();
      setPlayState('idle');
      return;
    }

    setPlayState('loading');
    try {
      const data = await getPreview(id);
      if (!data.preview_url) {
        setPlayState('unavailable');
        setTimeout(() => setPlayState('idle'), 2000);
        return;
      }
      playPreview(data.preview_url, () => setPlayState('idle'));
      setPlayState('playing');
    } catch {
      setPlayState('unavailable');
      setTimeout(() => setPlayState('idle'), 2000);
    }
  };

  if (status === 'loading') return <div className="page text-secondary">Loading…</div>;
  if (status === 'error' || !song) {
    return <div className="page text-secondary">Couldn't load this song.</div>;
  }

  const playLabel = { idle: '▶ Play preview', loading: 'Loading…', playing: '❚❚ Pause', unavailable: 'No preview available' }[playState];

  return (
    <div className="page">
      <div className="glass detail-header-wrap">
        <div className="detail-header">
          <div
            className="detail-header__art"
            role="button"
            tabIndex={0}
            onClick={handlePlay}
            onKeyDown={(e) => e.key === 'Enter' && handlePlay()}
            data-cursor-hover
            style={
              song.image_url
                ? { backgroundImage: `url(${song.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                : { background: GRADIENTS[song.id % GRADIENTS.length] }
            }
          >
            <div className={`detail-header__play-overlay ${playState === 'playing' ? 'is-active' : ''}`}>
              {{ idle: '▶', loading: '…', playing: '❚❚', unavailable: '✕' }[playState]}
            </div>
          </div>
          <div>
            <div className="detail-header__title display">{song.title}</div>
            <p className="text-secondary">{song.artist} — {song.album}</p>
            <p className="text-muted" style={{ marginTop: '0.5rem' }}>
              {Math.round(song.tempo)} BPM · {Math.round(song.popularity)}% popularity
            </p>
            <button
              className="glass glass-btn glass-btn--accent"
              style={{ marginTop: '1rem' }}
              onClick={handlePlay}
              data-cursor-hover
            >
              {playLabel}
            </button>
          </div>
        </div>
      </div>

      <div className="section-header">
        <span className="section-header__badge">💫</span>
        <h2 className="section-title display">Because you're into this</h2>
      </div>
      <div className="song-grid">
        {recs.map((rec) => (
          <SongCard key={rec.id} song={rec} />
        ))}
      </div>
    </div>
  );
}
