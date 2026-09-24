import React, { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import { Wheel } from '../components/Wheel';
import { ResultReveal } from '../components/ResultReveal';
import { ParticipantList } from '../components/ParticipantList';
import { Header } from '../components/Header';
import type { Person, HistoryEntry, Settings } from '../types';
import { useWheel } from '../hooks/useWheel';
import { initAudio } from '../utils/sound';

interface WheelScreenProps {
  kind: 'contestant' | 'judge';
  people: Person[];
  history: HistoryEntry[];
  pendingRevealId: string | null;
  settings: Settings;
  onToggleSound: () => void;
  onSelectPerson: (id: string) => void;
  onClearPendingReveal: () => void;
  presentationMode?: boolean;
}

function useWindowSize() {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    const handler = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return size;
}

export const WheelScreen: React.FC<WheelScreenProps> = ({
  kind,
  people,
  history,
  pendingRevealId,
  settings,
  onToggleSound,
  onSelectPerson,
  onClearPendingReveal,
  presentationMode = false,
}) => {
  const unselected = useMemo(() => people.filter(p => !p.selected), [people]);
  const total = people.length;
  const remaining = unselected.length;
  const selected = total - remaining;
  const isFinal = remaining === 1;
  const allSelected = remaining === 0;

  // Wheel rotation state persisted per-kind via localStorage
  const rotKey = `toastmasters_${kind}_rotation`;
  const [savedRot] = useState(() => {
    try { return parseFloat(localStorage.getItem(rotKey) ?? '0') || 0; } catch { return 0; }
  });

  const [currentRot, setCurrentRot] = useState(savedRot);

  // Pending reveal: if page reloaded with a pending reveal, show immediately
  const pendingPerson = pendingRevealId ? people.find(p => p.id === pendingRevealId) : null;
  const [showReveal, setShowReveal] = useState(() => !!pendingRevealId && !!pendingPerson);

  // Snapshot of segments at spin start (prevent segment list changing mid-spin)
  const [spinSnapshot, setSpinSnapshot] = useState<Person[]>(unselected);
  const isSpinningRef = useRef(false);

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const handleSpinStart = useCallback((winnerId: string) => {
    setSpinSnapshot([...unselected]);
    isSpinningRef.current = true;
    onSelectPerson(winnerId);
  }, [unselected, onSelectPerson]);

  const handleSpinComplete = useCallback(() => {
    isSpinningRef.current = false;
    setShowReveal(true);
  }, []);

  const { rotation, isSpinning, spin, setRotation } = useWheel({
    unselected: spinSnapshot.length > 0 && isSpinningRef.current ? spinSnapshot : unselected,
    currentRotation: currentRot,
    onSpinStart: handleSpinStart,
    onSpinComplete: handleSpinComplete,
    reducedMotion,
  });

  // Persist rotation to localStorage without re-triggering state loop
  useEffect(() => {
    if (!isSpinning) {
      const normalized = ((rotation % 360) + 360) % 360;
      try { localStorage.setItem(rotKey, String(normalized)); } catch { /* */ }
    }
  }, [rotation, isSpinning, rotKey]);

  const handleContinue = useCallback(() => {
    setShowReveal(false);
    onClearPendingReveal();
    // After reveal dismissed, reset rotation to 0 without animation
    setCurrentRot(0);
    setRotation(0);
    try { localStorage.setItem(rotKey, '0'); } catch { /* */ }
  }, [onClearPendingReveal, setRotation, rotKey]);

  // Keyboard: Space/Enter to spin or continue
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (showReveal) {
          handleContinue();
        } else if (!isSpinning && !allSelected) {
          initAudio();
          spin();
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [showReveal, isSpinning, allSelected, spin, handleContinue]);

  const { w, h } = useWindowSize();
  // Wheel size: fill available space
  const headerH = presentationMode ? 0 : 72;
  const statsH = presentationMode ? 0 : 80;
  const sideW = presentationMode ? 0 : 280;
  const spinBtnH = presentationMode ? 80 : 80;
  const availH = h - headerH - statsH - spinBtnH - 80;
  const availW = w - sideW - 40;
  const wheelSize = Math.min(availH, availW, 700);

  const subtitle = kind === 'contestant' ? 'CONTESTANT SELECTION' : 'EVALUATION JUDGE SELECTION';

  // The reveal person (either the pending one on reload, or whoever was just selected)
  const revealPerson = pendingPerson ?? people.find(p => p.id === (history[history.length - 1]?.personId));
  const revealIsFinal = history.length === total;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {!presentationMode && (
        <Header settings={settings} onToggleSound={onToggleSound} subtitle={subtitle} />
      )}

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        {/* Main area */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1.5rem',
            padding: '1rem',
            overflow: 'hidden',
          }}
        >
          {!presentationMode && (
            <div
              style={{
                textAlign: 'center',
                paddingBottom: '0.5rem',
              }}
            >
              <p
                style={{
                  fontSize: '0.6rem',
                  letterSpacing: '0.3em',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                }}
              >
                Toastmasters International
              </p>
              <h1
                style={{
                  fontFamily: 'Playfair Display, serif',
                  fontSize: 'clamp(1rem, 2.5vw, 1.6rem)',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  letterSpacing: '0.05em',
                  marginTop: '4px',
                }}
              >
                {settings.contestName}
              </h1>
              <p
                style={{
                  fontSize: '0.6rem',
                  letterSpacing: '0.25em',
                  color: 'var(--gold)',
                  textTransform: 'uppercase',
                  marginTop: '4px',
                }}
              >
                {subtitle}
              </p>
            </div>
          )}

          {/* Wheel */}
          <div
            style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            aria-label={`${kind} selection wheel`}
          >
            {allSelected ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '1rem',
                  width: wheelSize,
                  height: wheelSize,
                  justifyContent: 'center',
                }}
              >
                <Wheel people={[]} rotation={0} size={wheelSize} />
                <p
                  style={{
                    position: 'absolute',
                    fontSize: '0.75rem',
                    letterSpacing: '0.2em',
                    color: 'var(--gold)',
                    textTransform: 'uppercase',
                  }}
                >
                  All {kind === 'contestant' ? 'Contestants' : 'Judges'} Selected
                </p>
              </div>
            ) : (
              <Wheel
                people={isSpinning ? spinSnapshot : unselected}
                rotation={rotation}
                size={wheelSize}
              />
            )}
          </div>

          {/* Spin button */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <button
              id={`spin-btn-${kind}`}
              onClick={() => { initAudio(); spin(); }}
              disabled={isSpinning || allSelected}
              aria-label={`Spin the wheel to select a ${kind}`}
              style={{
                padding: '1rem 3.5rem',
                background: (isSpinning || allSelected) ? 'rgba(212,175,55,0.1)' : 'var(--gold)',
                color: (isSpinning || allSelected) ? 'var(--text-muted)' : '#080A0F',
                border: '1px solid var(--gold)',
                borderRadius: '4px',
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.8rem',
                fontWeight: 700,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                cursor: (isSpinning || allSelected) ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s, color 0.2s',
              }}
            >
              {isSpinning ? 'SPINNING…' : isFinal ? `FINAL ${kind.toUpperCase()}` : 'SPIN THE WHEEL'}
            </button>
            {!presentationMode && (
              <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
                SPACE OR ENTER TO SPIN
              </p>
            )}
          </div>

          {/* Stats */}
          {!presentationMode && (
            <div
              style={{
                display: 'flex',
                gap: '2rem',
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              <span>Total <strong style={{ color: 'var(--text-primary)' }}>{total}</strong></span>
              <span>Selected <strong style={{ color: 'var(--gold)' }}>{selected}</strong></span>
              <span>Remaining <strong style={{ color: 'var(--text-primary)' }}>{remaining}</strong></span>
            </div>
          )}
        </div>

        {/* Sidebar history list */}
        {!presentationMode && (
          <aside
            style={{
              width: '280px',
              minWidth: '240px',
              padding: '1rem',
              borderLeft: '1px solid var(--border-subtle)',
              overflowY: 'auto',
              flexShrink: 0,
            }}
          >
            <ParticipantList history={history} kind={kind} />
          </aside>
        )}
      </div>

      {/* Result Reveal Overlay */}
      <ResultReveal
        isOpen={showReveal}
        name={revealPerson?.name ?? ''}
        kind={kind}
        isFinal={revealIsFinal}
        onContinue={handleContinue}
      />
    </div>
  );
};
