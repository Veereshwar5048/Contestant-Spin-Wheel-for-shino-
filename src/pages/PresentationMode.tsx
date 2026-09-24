import React, { useCallback, useEffect, useState } from 'react';
import { Maximize2, Minimize2, Users, Award } from 'lucide-react';
import { WheelScreen } from './WheelScreen';
import type { Person, HistoryEntry, Settings } from '../types';
import type { RosterKind } from '../types';

interface PresentationModeProps {
  contestantPeople: Person[];
  contestantHistory: HistoryEntry[];
  contestantPending: string | null;
  judgePeople: Person[];
  judgeHistory: HistoryEntry[];
  judgePending: string | null;
  settings: Settings;
  onToggleSound: () => void;
  onSelectContestant: (id: string) => void;
  onClearContestantPending: () => void;
  onSelectJudge: (id: string) => void;
  onClearJudgePending: () => void;
}

export const PresentationMode: React.FC<PresentationModeProps> = ({
  contestantPeople,
  contestantHistory,
  contestantPending,
  judgePeople,
  judgeHistory,
  judgePending,
  settings,
  onToggleSound,
  onSelectContestant,
  onClearContestantPending,
  onSelectJudge,
  onClearJudgePending,
}) => {
  const [kind, setKind] = useState<RosterKind>('contestant');
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);
  const [controlsVisible, setControlsVisible] = useState(true);

  // Fade controls after 3s inactivity
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const show = () => {
      setControlsVisible(true);
      clearTimeout(timer);
      timer = setTimeout(() => setControlsVisible(false), 3000);
    };
    show();
    document.addEventListener('mousemove', show);
    document.addEventListener('keydown', show);
    return () => {
      document.removeEventListener('mousemove', show);
      document.removeEventListener('keydown', show);
      clearTimeout(timer);
    };
  }, []);

  // Fullscreen tracking
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'f' || e.key === 'F') toggleFullscreen();
      if (e.key === 'Escape') {
        if (!document.fullscreenElement) {
          window.location.hash = '#/';
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [toggleFullscreen]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--bg-primary)',
        overflow: 'hidden',
      }}
    >
      {/* Main wheel in presentation mode */}
      {kind === 'contestant' ? (
        <WheelScreen
          kind="contestant"
          people={contestantPeople}
          history={contestantHistory}
          pendingRevealId={contestantPending}
          settings={settings}
          onToggleSound={onToggleSound}
          onSelectPerson={onSelectContestant}
          onClearPendingReveal={onClearContestantPending}
          presentationMode
        />
      ) : (
        <WheelScreen
          kind="judge"
          people={judgePeople}
          history={judgeHistory}
          pendingRevealId={judgePending}
          settings={settings}
          onToggleSound={onToggleSound}
          onSelectPerson={onSelectJudge}
          onClearPendingReveal={onClearJudgePending}
          presentationMode
        />
      )}

      {/* Floating controls — fade out after inactivity */}
      <div
        style={{
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          display: 'flex',
          gap: '0.5rem',
          alignItems: 'center',
          opacity: controlsVisible ? 1 : 0,
          transition: 'opacity 0.5s ease',
          zIndex: 3000,
          pointerEvents: controlsVisible ? 'auto' : 'none',
        }}
      >
        {/* Kind toggle */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(13,17,23,0.9)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            overflow: 'hidden',
          }}
        >
          <button
            onClick={() => setKind('contestant')}
            aria-pressed={kind === 'contestant'}
            aria-label="Show contestants wheel"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 0.85rem',
              background: kind === 'contestant' ? 'rgba(212,175,55,0.15)' : 'transparent',
              color: kind === 'contestant' ? 'var(--gold)' : 'var(--text-muted)',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.7rem',
              letterSpacing: '0.05em',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            <Users size={13} />
            Contestants
          </button>
          <button
            onClick={() => setKind('judge')}
            aria-pressed={kind === 'judge'}
            aria-label="Show judges wheel"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 0.85rem',
              background: kind === 'judge' ? 'rgba(212,175,55,0.15)' : 'transparent',
              color: kind === 'judge' ? 'var(--gold)' : 'var(--text-muted)',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.7rem',
              letterSpacing: '0.05em',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            <Award size={13} />
            Evaluation
          </button>
        </div>

        {/* Fullscreen */}
        <button
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          style={{
            background: 'rgba(13,17,23,0.9)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-muted)',
            borderRadius: '6px',
            padding: '0.5rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
        </button>

        {/* Exit presentation */}
        <a
          href="#/"
          aria-label="Exit presentation mode"
          style={{
            background: 'rgba(13,17,23,0.9)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-muted)',
            borderRadius: '6px',
            padding: '0.5rem 0.75rem',
            textDecoration: 'none',
            fontSize: '0.65rem',
            letterSpacing: '0.1em',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          EXIT
        </a>
      </div>
    </div>
  );
};
