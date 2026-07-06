import { useEffect, useRef } from 'react';

/**
 * Custom glowing cursor — a tight dot + a trailing ring that
 * expands when hovering anything clickable (button, a, [data-cursor-hover]).
 * Drop this once near the root of your app (e.g. in App.jsx).
 */
export default function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    let ringX = 0, ringY = 0;
    let targetX = 0, targetY = 0;

    const handleMove = (e) => {
      targetX = e.clientX;
      targetY = e.clientY;
      dot.style.left = `${targetX}px`;
      dot.style.top = `${targetY}px`;
    };

    const handleOver = (e) => {
      const isInteractive = e.target.closest(
        'button, a, input, [data-cursor-hover], .glass-btn'
      );
      ring.classList.toggle('is-hovering', Boolean(isInteractive));
    };

    // Smooth trailing animation for the ring
    let rafId;
    const animate = () => {
      ringX += (targetX - ringX) * 0.15;
      ringY += (targetY - ringY) * 0.15;
      ring.style.left = `${ringX}px`;
      ring.style.top = `${ringY}px`;
      rafId = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseover', handleOver);
    rafId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseover', handleOver);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="cursor-dot" />
      <div ref={ringRef} className="cursor-ring" />
    </>
  );
}
