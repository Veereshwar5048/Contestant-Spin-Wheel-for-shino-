import React, { useEffect, useRef } from 'react';
import type { Settings } from '../types';

interface HomeProps {
  settings: Settings;
}

export const Home: React.FC<HomeProps> = ({ settings }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Subtle ambient background motion — slow drifting particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;

    const particles = Array.from({ length: 40 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.5 + 0.3,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.15,
      alpha: Math.random() * 0.3 + 0.05,
    }));

    function draw() {
      ctx!.clearRect(0, 0, w, h);
      for (const p of particles) {
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(212,175,55,${p.alpha})`;
        ctx!.fill();
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;
      }
      animId = requestAnimationFrame(draw);
    }

    draw();
    const onResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient canvas */}
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        aria-hidden="true"
      />

      {/* Radial vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 50% 40%, rgba(212,175,55,0.04) 0%, rgba(8,10,15,0.6) 70%)',
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      />

      {/* Content */}
      <div
        style={{
          position: 'relative',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5rem',
          padding: '2rem',
          maxWidth: '640px',
        }}
      >
        {/* Top rule */}
        <div
          style={{
            width: '80px',
            height: '1px',
            background: 'var(--gold)',
            opacity: 0.5,
          }}
        />

        {/* Organization */}
        <p
          style={{
            fontSize: '0.7rem',
            letterSpacing: '0.4em',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
          }}
        >
          Toastmasters International
        </p>

        {/* Contest title */}
        <h1
          style={{
            fontFamily: 'Playfair Display, Georgia, serif',
            fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
            fontWeight: 700,
            color: 'var(--text-primary)',
            lineHeight: 1.1,
          }}
        >
          {settings.contestName}
        </h1>

        {/* Speech Contest */}
        <p
          style={{
            fontSize: '0.8rem',
            letterSpacing: '0.3em',
            color: 'var(--gold)',
            textTransform: 'uppercase',
          }}
        >
          Speech Contest
        </p>

        {/* Club name */}
        {settings.clubName && (
          <p
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              letterSpacing: '0.1em',
            }}
          >
            {settings.clubName}
          </p>
        )}

        {/* Details */}
        {(settings.date || settings.venue) && (
          <div
            style={{
              display: 'flex',
              gap: '1.5rem',
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
              letterSpacing: '0.1em',
            }}
          >
            {settings.date && <span>{settings.date}</span>}
            {settings.venue && <span>{settings.venue}</span>}
          </div>
        )}

        {/* Bottom rule */}
        <div
          style={{
            width: '80px',
            height: '1px',
            background: 'var(--gold)',
            opacity: 0.5,
          }}
        />

        {/* CTA Buttons */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '0.5rem' }}>
          <a
            href="#/contestants"
            style={{
              padding: '0.85rem 2.5rem',
              background: 'var(--gold)',
              color: '#080A0F',
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              borderRadius: '4px',
              transition: 'background 0.2s, transform 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--gold-light)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--gold)'; }}
          >
            Enter Contest
          </a>
          <a
            href="#/present"
            style={{
              padding: '0.85rem 2.5rem',
              background: 'transparent',
              color: 'var(--gold)',
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              borderRadius: '4px',
              border: '1px solid var(--gold)',
              transition: 'background 0.2s, color 0.2s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = 'var(--gold)';
              (e.currentTarget as HTMLElement).style.color = '#080A0F';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'transparent';
              (e.currentTarget as HTMLElement).style.color = 'var(--gold)';
            }}
          >
            Presentation Mode
          </a>
        </div>
      </div>
    </div>
  );
};
