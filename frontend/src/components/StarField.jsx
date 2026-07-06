import { useMemo } from 'react';

/**
 * Renders the night-sky background: drifting gold aurora + twinkling stars.
 * Fully CSS-driven (no canvas), fades out automatically in light mode via
 * the .sky-layer opacity rule in theme.css.
 * Drop this once near the root of your app, behind everything else.
 */
export default function StarField({ starCount = 80 }) {
  const stars = useMemo(() => {
    return Array.from({ length: starCount }, (_, i) => ({
      id: i,
      top: Math.random() * 100,
      left: Math.random() * 100,
      size: Math.random() * 2 + 1,
      duration: Math.random() * 3 + 2,
      opacity: Math.random() * 0.5 + 0.3,
      delay: Math.random() * 4,
    }));
  }, [starCount]);

  return (
    <div className="sky-layer" aria-hidden="true">
      <div className="aurora-band" />
      {stars.map((s) => (
        <div
          key={s.id}
          className="star"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            '--dur': `${s.duration}s`,
            '--op': s.opacity,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
