// ─── WebAudio Sound ─────────────────────────────────────────────────────────
// All sounds synthesized; no asset files required.

let ctx: AudioContext | null = null;
let enabled = false;

export function initAudio(): void {
  if (!ctx) {
    try {
      ctx = new AudioContext();
    } catch {
      /* not available */
    }
  }
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
}

export function setAudioEnabled(on: boolean): void {
  enabled = on;
  if (on) initAudio();
}

function ensureCtx(): AudioContext | null {
  if (!enabled) return null;
  if (!ctx) initAudio();
  return ctx;
}

/** Soft tick for each segment crossing. */
export function playTick(): void {
  const c = ensureCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.connect(gain);
  gain.connect(c.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(440, c.currentTime + 0.04);
  gain.gain.setValueAtTime(0.06, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.05);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + 0.06);
}

/** Gentle chime on reveal. */
export function playRevealChime(): void {
  const c = ensureCtx();
  if (!c) return;
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
  notes.forEach((freq, i) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.type = 'sine';
    const t = c.currentTime + i * 0.18;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.12, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
    osc.start(t);
    osc.stop(t + 1.3);
  });
}
