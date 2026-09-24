import { useState, useCallback, useRef, useEffect } from 'react';
import type { Person } from '../types';
import { computeSpinRotation, segmentUnderPointer } from '../utils/wheelMath';
import { pickRandom } from '../utils/randomSelection';
import { playTick } from '../utils/sound';

interface UseWheelOptions {
  unselected: Person[];
  currentRotation: number;
  onSpinStart: (winnerId: string) => void;
  onSpinComplete: () => void;
  reducedMotion: boolean;
}

interface UseWheelReturn {
  rotation: number;
  isSpinning: boolean;
  spin: () => void;
  setRotation: (r: number) => void;
}

export function useWheel({
  unselected,
  currentRotation,
  onSpinStart,
  onSpinComplete,
  reducedMotion,
}: UseWheelOptions): UseWheelReturn {
  const [rotation, setRotationState] = useState(currentRotation);
  const [isSpinning, setIsSpinning] = useState(false);
  const spinLock = useRef(false);
  const rafRef = useRef<number | null>(null);
  const lastSegRef = useRef<number>(-1);

  // Sync rotation when prop changes (e.g., after reset or page reload)
  useEffect(() => {
    if (!isSpinning) setRotationState(currentRotation);
  }, [currentRotation, isSpinning]);

  const setRotation = useCallback((r: number) => {
    setRotationState(r);
  }, []);

  const spin = useCallback(() => {
    if (spinLock.current || isSpinning || unselected.length === 0) return;
    spinLock.current = true;
    setIsSpinning(true);

    // Pick winner FIRST
    const winnerIdx = pickRandom(unselected);
    const winner = unselected[winnerIdx];

    // Compute final rotation
    const { finalRotation } = computeSpinRotation(
      unselected.length,
      rotation,
      winnerIdx,
    );

    // Commit result at spin START
    onSpinStart(winner.id);

    const N = unselected.length;
    const duration = reducedMotion ? 1200 : 6000 + Math.random() * 2000;
    const startRot = rotation;
    const deltaRot = finalRotation - startRot;
    const startTime = performance.now();
    lastSegRef.current = -1;

    function easeOutQuint(t: number): number {
      return 1 - Math.pow(1 - t, 5);
    }

    function frame(now: number) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = easeOutQuint(t);
      const currentRot = startRot + deltaRot * eased;

      // Segment-crossing tick
      if (N > 1) {
        const seg = segmentUnderPointer(currentRot, N);
        if (seg !== lastSegRef.current && lastSegRef.current !== -1) {
          playTick();
        }
        lastSegRef.current = seg;
      }

      setRotationState(currentRot);

      if (t < 1) {
        rafRef.current = requestAnimationFrame(frame);
      } else {
        // Normalize to mod 360 without animation (will be set synchronously)
        const normalized = ((finalRotation % 360) + 360) % 360;
        setRotationState(normalized);
        setIsSpinning(false);
        spinLock.current = false;
        onSpinComplete();
      }
    }

    rafRef.current = requestAnimationFrame(frame);
  }, [isSpinning, unselected, rotation, onSpinStart, onSpinComplete, reducedMotion]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return { rotation, isSpinning, spin, setRotation };
}
