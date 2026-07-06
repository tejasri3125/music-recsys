import { useEffect, useRef } from 'react';

/**
 * Interactive hero: a music note shape built from small dots that
 * scatter away from the mouse and spring back into place.
 *
 * Note the resize() fix — canvas.width must be read back AFTER setting
 * it, not taken from the original CSS rect width. CSS layout widths are
 * often fractional (e.g. 604.36px), but the canvas rounds to a whole
 * pixel internally. Using the fractional number for pixel-array index
 * math produces non-integer indexes, which silently return undefined
 * instead of throwing — so particles just don't appear, with no error.
 */
export default function ParticleHero({ children }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext('2d');
    let W = 0, H = 0, particles = [], mouse = { x: -9999, y: -9999 }, animId = 0;

    function resize() {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width || 500;
      canvas.height = rect.height || 560;
      W = canvas.width;
      H = canvas.height;
    }

    function sampleShape() {
      try {
        const off = document.createElement('canvas');
        off.width = W;
        off.height = H;
        const octx = off.getContext('2d');

        const cx = W * 0.42;
        const scale = Math.max(1.5, Math.min(W / 300, 3.4));
        const stemH = 130 * scale;
        // Shifted down from dead-center to compensate for the stems
        // extending far upward — without this, the shape's visual
        // weight sits noticeably above the panel's true middle.
        const cy = H * 0.5 + stemH * 0.28;
        const headRX = 26 * scale, headRY = 19 * scale;
        const noteGap = 110 * scale;

        function drawNote(x, y) {
          octx.save();
          octx.translate(x, y);
          octx.rotate(-0.2);
          octx.fillStyle = '#fff';
          octx.beginPath();
          octx.ellipse(0, 0, headRX, headRY, 0, 0, Math.PI * 2);
          octx.fill();
          octx.restore();
          octx.fillStyle = '#fff';
          octx.fillRect(x + headRX - 9 * scale, y - stemH, 9 * scale, stemH);
        }

        const leftX = cx - noteGap / 2;
        const rightX = cx + noteGap / 2;
        const leftY = cy + 20 * scale;
        const rightY = cy - 10 * scale;

        drawNote(leftX, leftY);
        drawNote(rightX, rightY);

        octx.fillStyle = '#fff';
        octx.beginPath();
        octx.moveTo(leftX + headRX - 9 * scale, leftY - stemH);
        octx.lineTo(rightX + headRX - 9 * scale, rightY - stemH);
        octx.lineTo(rightX + headRX - 9 * scale, rightY - stemH + 16 * scale);
        octx.lineTo(leftX + headRX - 9 * scale, leftY - stemH + 16 * scale);
        octx.closePath();
        octx.fill();

        const data = octx.getImageData(0, 0, W, H).data;
        const pts = [];
        const gap = 5;
        const style = getComputedStyle(document.body);
        const colors = [
          style.getPropertyValue('--particle-1').trim() || '#FF9466',
          style.getPropertyValue('--particle-2').trim() || '#FFB199',
          style.getPropertyValue('--particle-3').trim() || '#C99BFF',
          style.getPropertyValue('--particle-4').trim() || '#7C5CFC',
        ];

        for (let y = 0; y < H; y += gap) {
          for (let x = 0; x < W; x += gap) {
            const idx = (y * W + x) * 4;
            if (data[idx + 3] > 128) {
              pts.push({
                x: x + (Math.random() - 0.5) * 40,
                y: y + (Math.random() - 0.5) * 40,
                hx: x,
                hy: y,
                vx: 0,
                vy: 0,
                col: colors[Math.floor(Math.random() * colors.length)],
                sz: Math.random() * 1.6 + 1.2,
              });
            }
          }
        }
        return pts;
      } catch (err) {
        console.error('ParticleHero sampleShape() failed:', err);
        return [];
      }
    }

    function init() {
      resize();
      particles = sampleShape();
    }

    function tick() {
      ctx.clearRect(0, 0, W, H);
      for (const p of particles) {
        const dx = p.x - mouse.x, dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const repelRadius = 110;

        if (dist < repelRadius) {
          const force = (repelRadius - dist) / repelRadius;
          p.vx += (dx / dist) * force * 2.2;
          p.vy += (dy / dist) * force * 2.2;
        }

        p.vx += (p.hx - p.x) * 0.02;
        p.vy += (p.hy - p.y) * 0.02;
        p.vx *= 0.85;
        p.vy *= 0.85;
        p.x += p.vx;
        p.y += p.vy;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.sz, 0, Math.PI * 2);
        ctx.fillStyle = p.col;
        ctx.fill();
      }
      animId = requestAnimationFrame(tick);
    }

    const handleMove = (e) => {
      const r = container.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    };
    const handleLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };

    let resizeTimeout;
    const debouncedInit = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(init, 150);
    };

    init();
    tick();

    container.addEventListener('mousemove', handleMove);
    container.addEventListener('mouseleave', handleLeave);
    window.addEventListener('resize', debouncedInit);

    // Re-sample particle colors when the theme toggles (dark/light)
    const themeObserver = new MutationObserver(() => setTimeout(init, 50));
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    return () => {
      cancelAnimationFrame(animId);
      clearTimeout(resizeTimeout);
      container.removeEventListener('mousemove', handleMove);
      container.removeEventListener('mouseleave', handleLeave);
      window.removeEventListener('resize', debouncedInit);
      themeObserver.disconnect();
    };
  }, []);

  return (
    <div className="particle-hero">
      <div className="particle-hero__glow-orb particle-hero__glow-orb--1" />
      <div className="particle-hero__glow-orb particle-hero__glow-orb--2" />
      <div className="particle-hero__glow-orb particle-hero__glow-orb--3" />
      <div className="particle-hero__glow-orb particle-hero__glow-orb--4" />
      <div className="particle-hero__glow-orb particle-hero__glow-orb--note-1" />
      <div className="particle-hero__glow-orb particle-hero__glow-orb--note-2" />
      <div className="particle-hero__float-note particle-hero__float-note--1">&#9834;</div>
      <div className="particle-hero__float-note particle-hero__float-note--2">&#9835;</div>
      <div className="particle-hero__float-note particle-hero__float-note--3">&#9833;</div>
      <div className="particle-hero__float-note particle-hero__float-note--4">&#9834;</div>
      <div className="particle-hero__float-note particle-hero__float-note--5">&#9835;</div>
      <div className="particle-hero__float-note particle-hero__float-note--6">&#9833;</div>
      <div className="particle-hero__float-note particle-hero__float-note--7">&#9836;</div>
      <div className="particle-hero__float-note particle-hero__float-note--8">&#9839;</div>
      <div className="particle-hero__float-note particle-hero__float-note--9">&#9837;</div>

      {children}

      <div className="particle-hero__canvas-side" ref={containerRef}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
