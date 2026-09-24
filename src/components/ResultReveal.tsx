import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playRevealChime } from '../utils/sound';

interface ResultRevealProps {
  isOpen: boolean;
  name: string;
  kind: 'contestant' | 'judge';
  isFinal: boolean;
  onContinue: () => void;
}

export const ResultReveal: React.FC<ResultRevealProps> = ({
  isOpen,
  name,
  kind,
  isFinal,
  onContinue,
}) => {
  const [phase, setPhase] = useState<'intro' | 'name' | 'done'>('intro');
  const hasChimed = useRef(false);
  const liveRef = useRef<HTMLDivElement>(null);

  const label = kind === 'contestant' ? 'THE CONTESTANT IS' : 'THE EVALUATION JUDGE IS';
  const bottomLabel = kind === 'contestant'
    ? (isFinal ? 'FINAL CONTESTANT SELECTED' : 'CONTESTANT SELECTED')
    : (isFinal ? 'FINAL JUDGE SELECTED' : 'EVALUATION JUDGE SELECTED');

  useEffect(() => {
    if (!isOpen) {
      setPhase('intro');
      hasChimed.current = false;
      return;
    }

    const t1 = setTimeout(() => setPhase('name'), 1200);
    return () => clearTimeout(t1);
  }, [isOpen]);

  useEffect(() => {
    if (phase === 'name' && !hasChimed.current) {
      hasChimed.current = true;
      playRevealChime();
      if (liveRef.current) {
        liveRef.current.textContent = `${label}: ${name}`;
      }
    }
  }, [phase, label, name]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onContinue();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onContinue]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(8,10,15,0.97)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            gap: '2rem',
          }}
          aria-live="assertive"
          aria-atomic="true"
        >
          {/* Screen-reader live region */}
          <div ref={liveRef} className="sr-only" aria-live="assertive" />

          {/* Decorative top line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{
              width: '200px',
              height: '1px',
              background: 'linear-gradient(to right, transparent, var(--gold), transparent)',
            }}
          />

          {/* Intro text */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            style={{
              fontSize: '1rem',
              letterSpacing: '0.4em',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {label}
          </motion.p>

          {/* Name reveal */}
          <AnimatePresence>
            {phase === 'name' && (
              <motion.div
                key="name"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, ease: [0.2, 0, 0, 1] }}
                style={{
                  textAlign: 'center',
                  padding: '1.5rem 3rem',
                  borderRadius: '4px',
                  position: 'relative',
                }}
              >
                {/* Glow behind name */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'radial-gradient(ellipse at center, rgba(212,175,55,0.08) 0%, transparent 70%)',
                    borderRadius: '4px',
                  }}
                />
                <h2
                  style={{
                    fontFamily: 'Playfair Display, Georgia, serif',
                    fontSize: 'clamp(2.5rem, 6vw, 5rem)',
                    fontWeight: 700,
                    color: 'var(--gold-light)',
                    textShadow: '0 0 60px rgba(242,214,117,0.4)',
                    lineHeight: 1.2,
                    position: 'relative',
                  }}
                >
                  {name}
                </h2>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom label */}
          <AnimatePresence>
            {phase === 'name' && (
              <motion.p
                key="bottom"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                style={{
                  fontSize: '0.75rem',
                  letterSpacing: '0.35em',
                  color: 'var(--gold)',
                  textTransform: 'uppercase',
                }}
              >
                {bottomLabel}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Decorative bottom line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
            style={{
              width: '200px',
              height: '1px',
              background: 'linear-gradient(to right, transparent, var(--gold), transparent)',
            }}
          />

          {/* Continue button */}
          <AnimatePresence>
            {phase === 'name' && (
              <motion.button
                key="continue"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.4 }}
                onClick={onContinue}
                style={{
                  marginTop: '1rem',
                  padding: '0.75rem 2.5rem',
                  background: 'transparent',
                  border: '1px solid var(--gold)',
                  color: 'var(--gold)',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '0.75rem',
                  letterSpacing: '0.25em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  transition: 'background 0.2s, color 0.2s',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'var(--gold)';
                  (e.currentTarget as HTMLButtonElement).style.color = '#080A0F';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--gold)';
                }}
              >
                CONTINUE — PRESS SPACE OR ENTER
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
