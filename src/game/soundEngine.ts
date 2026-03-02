// Web Audio API sound engine – no external files needed

let audioCtx: AudioContext | null = null;
let soundEnabled = localStorage.getItem('soundEnabled') !== 'false';

export const setSoundEnabled = (enabled: boolean) => {
  soundEnabled = enabled;
  localStorage.setItem('soundEnabled', enabled.toString());
};

export const isSoundEnabled = () => soundEnabled;

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

function playTone(
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.15,
  ramp?: { to: number; time: number },
) {
  if (!soundEnabled) return;
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = volume;
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  if (ramp) osc.frequency.linearRampToValueAtTime(ramp.to, ctx.currentTime + ramp.time);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

/** Piece selected */
export function playSelect() {
  playTone(600, 0.12, 'sine', 0.1);
}

/** Normal move */
export function playMove() {
  playTone(440, 0.08, 'triangle', 0.12);
  setTimeout(() => playTone(520, 0.08, 'triangle', 0.1), 50);
}

/** Capture */
export function playCapture() {
  playTone(300, 0.15, 'sawtooth', 0.08);
  setTimeout(() => playTone(500, 0.12, 'triangle', 0.12), 80);
  setTimeout(() => playTone(700, 0.1, 'sine', 0.1), 160);
}

/** King promotion */
export function playKing() {
  const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
  notes.forEach((n, i) => {
    setTimeout(() => playTone(n, 0.25, 'sine', 0.12), i * 100);
  });
}

/** Victory */
export function playVictory() {
  const melody = [523, 659, 784, 1047, 784, 1047, 1319];
  melody.forEach((n, i) => {
    setTimeout(() => playTone(n, 0.3, 'sine', 0.1), i * 120);
  });
}

/** Defeat */
export function playDefeat() {
  const melody = [400, 350, 300, 220];
  melody.forEach((n, i) => {
    setTimeout(() => playTone(n, 0.4, 'sawtooth', 0.06), i * 200);
  });
}

/** Invalid action / deselect */
export function playInvalid() {
  playTone(200, 0.1, 'square', 0.05);
}

/** Button click (UI) */
export function playClick() {
  playTone(800, 0.05, 'sine', 0.06);
}
