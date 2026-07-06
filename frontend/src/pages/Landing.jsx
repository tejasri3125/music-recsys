import { Link } from 'react-router-dom';
import ParticleHero from '../components/ParticleHero';

export default function Landing() {
  return (
    <ParticleHero>
      <div className="particle-hero__content">
        <div className="particle-hero__eyebrow">Hybrid recommendation engine</div>
        <h1 className="particle-hero__title">
          Music that actually <em>gets you.</em>
        </h1>
        <p className="particle-hero__subtitle">
          Move your cursor through the notes. Content-based and
          collaborative filtering, blended — no login required, just
          your taste.
        </p>
        <div className="particle-hero__actions">
          <Link to="/home" className="glass glass-btn glass-btn--accent" data-cursor-hover>
            Enter the app →
          </Link>
          <Link to="/search" className="glass glass-btn" data-cursor-hover>
            Browse songs
          </Link>
        </div>
      </div>
    </ParticleHero>
  );
}
