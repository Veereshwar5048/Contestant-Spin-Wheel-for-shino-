import React, { useEffect, useState } from 'react';
import { ArrowLeft, Copy } from 'lucide-react';
import type { HistoryEntry, Settings } from '../types';

interface FinalOrderScreenProps {
  kind: 'contestant' | 'judge';
  history: HistoryEntry[];
  settings: Settings;
  presentationMode?: boolean;
}

export const FinalOrderScreen: React.FC<FinalOrderScreenProps> = ({
  kind,
  history,
  settings,
  presentationMode = false,
}) => {
  const sorted = [...history].sort((a, b) => a.order - b.order);
  const useColumns = sorted.length > 8;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const heading = kind === 'contestant' ? 'FINAL CONTESTANT ORDER' : 'EVALUATION ORDER';
  const backHref = kind === 'contestant' ? '#/contestants' : '#/judges';

  // Stagger visibility: row i becomes visible after i * 250ms
  const [visibleCount, setVisibleCount] = useState(reducedMotion ? sorted.length : 0);
  useEffect(() => {
    if (reducedMotion) { setVisibleCount(sorted.length); return; }
    setVisibleCount(0);
    let i = 0;
    const tick = () => {
      i++;
      setVisibleCount(i);
      if (i < sorted.length) setTimeout(tick, 250);
    };
    const t = setTimeout(tick, 100);
    return () => clearTimeout(t);
  }, [sorted.length, reducedMotion]);

  // Keyboard: Esc = back to wheel
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !presentationMode) {
        window.location.hash = backHref;
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [backHref, presentationMode]);

  const handleCopy = () => {
    const text = sorted.map(e => `${e.order}. ${e.name}`).join('\n');
    navigator.clipboard.writeText(text).catch(() => {});
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(1rem, 3vh, 2.5rem) clamp(1rem, 4vw, 3rem)',
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 'clamp(1rem, 3vh, 2rem)' }}>
        <p
          style={{
            fontSize: '0.65rem',
            letterSpacing: '0.3em',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            marginBottom: '0.5rem',
          }}
        >
          {settings.contestName}
        </p>

        {/* Gold accent line */}
        <div
          style={{
            width: '60px',
            height: '1px',
            background: 'var(--gold)',
            margin: '0 auto 1rem',
            opacity: 0.6,
          }}
        />

        <h1
          style={{
            fontFamily: 'Playfair Display, Georgia, serif',
            fontSize: 'clamp(1.6rem, 3.5vw, 2.8rem)',
            fontWeight: 700,
            color: 'var(--gold-light)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            lineHeight: 1.15,
          }}
        >
          {heading}
        </h1>

        <div
          style={{
            width: '60px',
            height: '1px',
            background: 'var(--gold)',
            margin: '1rem auto 0',
            opacity: 0.6,
          }}
        />
      </div>

      {/* Order list */}
      <div
        style={{
          width: '100%',
          maxWidth: useColumns ? '960px' : '640px',
          display: useColumns ? 'grid' : 'flex',
          gridTemplateColumns: useColumns ? '1fr 1fr' : undefined,
          gap: useColumns ? '0 3rem' : undefined,
          flexDirection: useColumns ? undefined : 'column',
        }}
      >
        {sorted.map((entry, idx) => {
          const visible = idx < visibleCount;
          return (
            <div
              key={entry.personId + entry.order}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1.25rem',
                padding: 'clamp(0.5rem, 1.2vh, 0.9rem) 0',
                borderBottom: '1px solid rgba(212,175,55,0.12)',
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(12px)',
                transition: reducedMotion ? 'none' : 'opacity 0.35s ease, transform 0.35s ease',
              }}
            >
              <span
                style={{
                  fontFamily: 'Playfair Display, Georgia, serif',
                  fontSize: 'clamp(1.4rem, 2.8vw, 2.2rem)',
                  fontWeight: 700,
                  color: 'var(--gold)',
                  minWidth: 'clamp(2.2rem, 4vw, 3rem)',
                  textAlign: 'right',
                  flexShrink: 0,
                  lineHeight: 1,
                }}
              >
                {String(entry.order).padStart(2, '0')}
              </span>
              <span
                style={{
                  fontSize: 'clamp(1rem, 2vw, 1.6rem)',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  fontFamily: 'Inter, sans-serif',
                  letterSpacing: '0.02em',
                  lineHeight: 1.2,
                }}
              >
                {entry.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer controls */}
      <div
        style={{
          marginTop: 'clamp(1rem, 3vh, 2rem)',
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        {!presentationMode && (
          <>
            <a
              href={backHref}
              aria-label="Back to wheel"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.5rem',
                background: 'transparent',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
                borderRadius: '4px',
                textDecoration: 'none',
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.72rem',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
              }}
            >
              <ArrowLeft size={13} />
              Back to Wheel
            </a>
            <button
              onClick={handleCopy}
              aria-label="Copy order to clipboard"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.5rem',
                background: 'transparent',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
                borderRadius: '4px',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.72rem',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
              }}
            >
              <Copy size={13} />
              Copy Order
            </button>
          </>
        )}
      </div>
    </div>
  );
};
