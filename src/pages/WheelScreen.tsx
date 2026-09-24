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
  onFinalContinue?: () => void; // called after interstitial on the final pick
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

// ─── Interstitial overlay ─────────────────────────────────────────────────────
interface InterstitialProps {
  kind: 'contestant' | 'judge';
  onDone: () => void;
}
const Interstitial: React.FC<InterstitialProps> = ({ kind, onDone }) => {
  const label = kind === 'contestant' ? 'ALL CONTESTANTS SELECTED' : 'ALL EVALUATIONS SELECTED';
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Fade in
    const t1 = setTimeout(() => setVisible(true), 50);
    // Auto-advance after 2.5s
    const t2 = setTimeout(() => onDone(), 2500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  // Skip via Space/Enter/click
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onDone(); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onDone]);

  return (
    <div
      onClick={onDone}
      role="status"
      aria-live="assertive"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(8,10,15,0.97)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2500,
        gap: '1.5rem',
        cursor: 'pointer',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.5s ease',
      }}
    >
      <div
        style={{
          width: '80px',
          height: '1px',
          background: 'linear-gradient(to right, transparent, var(--gold), transparent)',
        }}
      />
      <p
        style={{
          fontFamily: 'Playfair Display, Georgia, serif',
          fontSize: 'clamp(1.8rem, 4vw, 3rem)',
          fontWeight: 700,
          color: 'var(--gold-light)',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          textAlign: 'center',
          padding: '0 2rem',
        }}
      >
        {label}
      </p>
      <div
        style={{
          width: '80px',
          height: '1px',
          background: 'linear-gradient(to right, transparent, var(--gold), transparent)',
        }}
      />
      <p
        style={{
          fontSize: '0.65rem',
          color: 'var(--text-muted)',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
        }}
      >
        Click or press Space to continue
      </p>
    </div>
  );
};

// ─── WheelScreen ─────────────────────────────────────────────────────────────
export const WheelScreen: React.FC<WheelScreenProps> = ({
  kind,
  people,
  history,
  pendingRevealId,
  settings,
  onToggleSound,
  onSelectPerson,
  onClearPendingReveal,
  onFinalContinue,
  presentationMode = false,
}) => {
  const unselected = useMemo(() => people.filter(p => !p.selected), [people]);
  const total = people.length;
  const remaining = unselected.length;
  const selected = total - remaining;
  const isFinal = remaining === 1;
  const allSelected = remaining === 0;
  const isComplete = allSelected && history.length >= 1;
  const kindLabel = kind === 'contestant' ? 'contestant' : 'evaluation';

  // Wheel rotation state persisted per-kind via localStorage
  const rotKey = `toastmasters_${kind}_rotation`;
  const [savedRot] = useState(() => {
    try { return parseFloat(localStorage.getItem(rotKey) ?? '0') || 0; } catch { return 0; }
  });

  const [currentRot, setCurrentRot] = useState(savedRot);

  // Pending reveal: if page reloaded with a pending reveal, show immediately
  const pendingPerson = pendingRevealId ? people.find(p => p.id === pendingRevealId) : null;
  const [showReveal, setShowReveal] = useState(() => !!pendingRevealId && !!pendingPerson);

  // Interstitial: shown only after final pick's reveal is dismissed
  const [showInterstitial, setShowInterstitial] = useState(false);

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

  // The reveal person (pending on reload, or most recent history entry)
  const revealPerson = pendingPerson ?? people.find(p => p.id === (history[history.length - 1]?.personId));
  // isFinal at the moment of this reveal = all people selected
  const revealIsFinal = history.length === total && total > 0;

  const handleContinue = useCallback(() => {
    setShowReveal(false);
    onClearPendingReveal();
    // Reset rotation for next fresh wheel
    setCurrentRot(0);
    setRotation(0);
    try { localStorage.setItem(rotKey, '0'); } catch { /* */ }

    // If this was the final pick, show interstitial before navigating
    if (revealIsFinal && onFinalContinue) {
      setShowInterstitial(true);
    }
  }, [onClearPendingReveal, setRotation, rotKey, revealIsFinal, onFinalContinue]);

  const handleInterstitialDone = useCallback(() => {
    setShowInterstitial(false);
    onFinalContinue?.();
  }, [onFinalContinue]);

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

  const subtitle = kind === 'contestant' ? 'CONTESTANT SELECTION' : 'EVALUATION SELECTION';
  const orderHref = kind === 'contestant' ? '#/contestants/order' : '#/judges/order';

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
            aria-label={`${kindLabel} selection wheel`}
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
                  All {kind === 'contestant' ? 'Contestants' : 'Evaluations'} Selected
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

          {/* Spin button or VIEW FINAL ORDER when complete */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            {isComplete && !presentationMode ? (
              <a
                href={orderHref}
                style={{
                  padding: '1rem 3.5rem',
                  background: 'var(--gold)',
                  color: '#080A0F',
                  border: '1px solid var(--gold)',
                  borderRadius: '4px',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  display: 'inline-block',
                }}
              >
                {kind === 'contestant' ? 'VIEW FINAL ORDER' : 'VIEW EVALUATION ORDER'}
              </a>
            ) : (
              <button
                id={`spin-btn-${kind}`}
                onClick={() => { initAudio(); spin(); }}
                disabled={isSpinning || allSelected}
                aria-label={`Spin the wheel to select a ${kindLabel}`}
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
                {isSpinning ? 'SPINNING…' : isFinal ? `FINAL ${kind === 'contestant' ? 'CONTESTANT' : 'EVALUATION'}` : 'SPIN THE WHEEL'}
              </button>
            )}
            {!presentationMode && !isComplete && (
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

      {/* Final interstitial — shown only after final reveal dismissed */}
      {showInterstitial && (
        <Interstitial kind={kind} onDone={handleInterstitialDone} />
      )}
    </div>
  );
};
