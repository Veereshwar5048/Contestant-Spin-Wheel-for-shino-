// ─── Wheel Math ──────────────────────────────────────────────────────────────
// seg = 360/N. Segment i covers [i*seg, (i+1)*seg) clockwise from 12 o'clock.
// Pointer is at 12 o'clock (angle 0). The wheel rotates by R degrees clockwise.
// After rotation R, segment i is under pointer when (i*seg - R) mod 360 ≈ 0.
// More precisely: pointer hits segment i when R ≡ i*seg (mod 360).

/**
 * Cryptographically secure random integer in [0, max) with no modulo bias.
 */
export function cryptoRandInt(max: number): number {
  if (max <= 0) throw new RangeError('max must be > 0');
  if (max === 1) return 0;
  const bitsNeeded = Math.ceil(Math.log2(max));
  const bytesNeeded = Math.ceil(bitsNeeded / 8);
  const threshold = 256 ** bytesNeeded - (256 ** bytesNeeded % max);
  const buf = new Uint8Array(bytesNeeded);
  let val: number;
  do {
    crypto.getRandomValues(buf);
    val = 0;
    for (let i = 0; i < bytesNeeded; i++) val = val * 256 + buf[i];
  } while (val >= threshold);
  return val % max;
}

/**
 * Cryptographically secure random float in [0, 1).
 */
export function cryptoRandFloat(): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] / 0x100000000;
}

export interface SpinResult {
  /** Final cumulative rotation in degrees (unbounded). */
  finalRotation: number;
  /** The winning segment index (0-based into the unselected list). */
  winnerIndex: number;
  /** The "landing point" angle in [0,360) from 12 o'clock that pointer aims at. */
  landingAngle: number;
}

/**
 * Compute the final rotation for a spin.
 * @param N            number of segments (= number of unselected people)
 * @param currentRot   current cumulative rotation (before this spin)
 * @param winnerIndex  the index of the segment that must end under the pointer
 */
export function computeSpinRotation(
  N: number,
  currentRot: number,
  winnerIndex: number,
): SpinResult {
  if (N <= 0) throw new RangeError('N must be > 0');

  const seg = 360 / N;

  // Landing jitter: random offset in [-0.3, 0.3] * seg so we don't always stop
  // dead-center, but never risk hitting a border.
  const jitter = (cryptoRandFloat() * 0.6 - 0.3); // [-0.3, 0.3]
  const landingAngle = ((winnerIndex + 0.5 + jitter) * seg + 360_000) % 360;

  // Rotation k: random in [5, 8] extra full spins
  const k = 5 + cryptoRandInt(4); // 5..8

  // We need: (landingAngle + Rfinal) ≡ 0  (mod 360)
  // i.e. Rfinal ≡ -landingAngle  (mod 360)
  // Rfinal = currentRot + delta
  // delta = mod(-landingAngle - currentRot, 360) + 360*k
  const modPart = ((-landingAngle - currentRot) % 360 + 360) % 360;
  const finalRotation = currentRot + modPart + 360 * k;

  return { finalRotation, winnerIndex, landingAngle };
}

/**
 * Given total rotation R (mod 360), return which segment index is under
 * the pointer (12 o'clock). Used for validation and segment-crossing detection.
 */
export function segmentUnderPointer(rotDeg: number, N: number): number {
  if (N <= 0) return -1;
  if (N === 1) return 0;
  const seg = 360 / N;
  // pointer at 0, wheel rotated R clockwise → the point at angle 0 in wheel-space
  // was originally at angle -R → which segment covers -R?
  const effectiveAngle = ((-rotDeg) % 360 + 360) % 360;
  return Math.floor(effectiveAngle / seg) % N;
}
