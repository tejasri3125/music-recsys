import { Link } from 'react-router-dom';
import { useState } from 'react';
import { postInteraction, getPreview } from '../api/client';
import { playPreview, stopCurrent } from '../utils/audioManager';

const GRADIENTS = [
  'linear-gradient(135deg, #FF9466, #E8703D)',
  'linear-gradient(135deg, #7C5CFC, #4C2E8C)',
  'linear-gradient(135deg, #FFB199, #C9536B)',
  'linear-gradient(135deg, #C99BFF, #7C5CFC)',
  'linear-gradient(135deg, #FFB199, #FF9466)',
];

function gradientFor(id) {
  return GRADIENTS[id % GRADIENTS.length];
}

export default function SongCard({ song }) {
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [playState, setPlayState] = useState('idle'); // idle | loading | playing | unavailable

  const handlePlay = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (playState === 'playing') {
      stopCurrent();
      setPlayState('idle');
      return;
    }

    setPlayState('loading');
    try {
      const data = await getPreview(song.id);
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

  const handleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const next = liked ? null : 'like';
    setLiked(!liked);
    setDisliked(false);
    try {
      await postInteraction(song.id, next || 'like');
    } catch {
      // fail silently — UI already reflects the tap
    }
  };

  const handleDislike = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const next = disliked ? null : 'dislike';
    setDisliked(!disliked);
    setLiked(false);
    try {
      await postInteraction(song.id, next || 'dislike');
    } catch {
      // fail silently
    }
  };

  const playLabel = { idle: '▶', loading: '…', playing: '❚❚', unavailable: '✕' }[playState];

  return (
    <Link to={`/song/${song.id}`} className="glass song-card" data-cursor-hover>
      <div
        className="song-card__art"
        style={
          song.image_url
            ? { backgroundImage: `url(${song.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : { '--art-gradient': gradientFor(song.id) }
        }
      >
        <button
          className={`glass icon-btn song-card__play ${playState === 'playing' ? 'is-active' : ''}`}
          onClick={handlePlay}
          aria-label={playState === 'playing' ? 'Pause' : 'Play preview'}
          data-cursor-hover
        >
          {playLabel}
        </button>
      </div>
      <div>
        <div className="song-card__title">{song.title}</div>
        <div className="song-card__meta">{song.artist} — {song.album}</div>
        {playState === 'unavailable' && (
          <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>
            No preview available
          </div>
        )}
        {song.reason && (
          <div className="reason-tag">{song.reason}</div>
        )}
      </div>
      <div className="song-card__actions">
        <button
          className={`glass icon-btn ${liked ? 'is-active' : ''}`}
          onClick={handleLike}
          aria-label="Like"
          data-cursor-hover
        >
          ♥
        </button>
        <button
          className={`glass icon-btn ${disliked ? 'is-active' : ''}`}
          onClick={handleDislike}
          aria-label="Dislike"
          data-cursor-hover
        >
          ✕
        </button>
      </div>
    </Link>
  );
}
