// Shared AudioContext (lazy initialization)
let sharedAudioCtx: AudioContext | null = null;
let isAudioMuted = false;
let lastPopTime = 0;
const POP_COOLDOWN_MS = 35;
const MAX_CONCURRENT_SOUNDS = 8;
let activeSoundCount = 0;

export const toggleAudioMute = (): boolean => {
  isAudioMuted = !isAudioMuted;
  if (isAudioMuted && sharedAudioCtx && sharedAudioCtx.state === 'running') {
    sharedAudioCtx.suspend();
  } else if (!isAudioMuted && sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume();
  }
  return isAudioMuted;
};

export const getIsAudioMuted = (): boolean => isAudioMuted;

const getAudioContext = (): AudioContext | null => {
  if (isAudioMuted) return null;
  try {
    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return null;
      sharedAudioCtx = new AudioContextClass();
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume();
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
};

/**
 * 1. Metallic atom collision impact
 */
export const playPopSound = (intensity: number = 1, basePitch: number = 900) => {
  if (isAudioMuted) return;
  const now = performance.now();
  if (now - lastPopTime < POP_COOLDOWN_MS) return;
  if (activeSoundCount >= MAX_CONCURRENT_SOUNDS) return;
  lastPopTime = now;

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    activeSoundCount++;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    // FM Synthesis for metallic/crystal bell timbre
    const modulator = ctx.createOscillator();
    const modGain = ctx.createGain();

    const freq = basePitch + Math.random() * 300;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.45, ctx.currentTime + 0.08);
    
    modulator.type = 'square';
    modulator.frequency.setValueAtTime(freq * 2.76, ctx.currentTime);
    modulator.connect(modGain);
    
    modGain.gain.setValueAtTime(400 * Math.min(intensity, 2), ctx.currentTime);
    modGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.04);
    modGain.connect(osc.frequency);

    gain.gain.setValueAtTime(0.25 * Math.min(intensity, 1.5), ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    modulator.start();
    osc.stop(ctx.currentTime + 0.08);
    modulator.stop(ctx.currentTime + 0.08);
    
    osc.onended = () => { activeSoundCount--; };
  } catch {
    activeSoundCount--;
  }
};

/**
 * 2. Musical Ring Score Chime (Ascending Pentatonic Scales)
 */
const PENTATONIC_SCALE = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66, 1318.51];

export const playRingScoreSound = (combo: number = 1, isPentagon: boolean = false) => {
  if (isAudioMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const rootIdx = (combo - 1) % PENTATONIC_SCALE.length;
    const baseFreq = PENTATONIC_SCALE[rootIdx] * (isPentagon ? 1.25 : 1.0);
    const now = ctx.currentTime;

    // Dual chime chord
    [baseFreq, baseFreq * 1.5].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = isPentagon ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.03);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.02, now + i * 0.03 + 0.25);

      gain.gain.setValueAtTime(0.25, now + i * 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.03 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + i * 0.03);
      osc.stop(now + i * 0.03 + 0.36);
    });
  } catch {
    // Ignore audio error
  }
};

/**
 * 3. Slingshot Pull & Release Swoosh
 */
export const playSlingshotRelease = (power: number = 1) => {
  if (isAudioMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150 + power * 100, now);
    osc.frequency.exponentialRampToValueAtTime(800 + power * 400, now + 0.12);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  } catch {
    // Ignore audio error
  }
};

/**
 * 4. Structural Stress Creak / Strain Groan
 */
let lastGroanTime = 0;
export const playStressGroan = (stressRatio: number) => {
  if (isAudioMuted || stressRatio < 1.3) return;
  const now = performance.now();
  if (now - lastGroanTime < 180) return;
  lastGroanTime = now;

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const t = ctx.currentTime;

    osc.type = 'sawtooth';
    const baseFreq = 80 + stressRatio * 60;
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.linearRampToValueAtTime(baseFreq + 30, t + 0.1);

    gain.gain.setValueAtTime(0.12 * Math.min(stressRatio - 1, 1), t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.13);
  } catch {
    // Ignore audio error
  }
};

/**
 * 5. Shatter Explosion Sound
 */
export const playShatterSound = () => {
  if (isAudioMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    // Layered crystal glass shatter burst
    for (let i = 0; i < 10; i++) {
      const delay = i * 0.012 + Math.random() * 0.02;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      const pitch = 1400 + Math.random() * 2000 - i * 80;
      osc.type = i % 2 === 0 ? 'triangle' : 'sawtooth';
      osc.frequency.setValueAtTime(pitch, now + delay);
      osc.frequency.exponentialRampToValueAtTime(pitch * 0.15, now + delay + 0.2);
      
      gain.gain.setValueAtTime(0.25 / (i * 0.5 + 1), now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.22);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now + delay);
      osc.stop(now + delay + 0.23);
    }
  } catch {
    // Ignore audio errors
  }
};

/**
 * 6. Reassemble Magnet Vortex Sound
 */
export const playReassembleSound = () => {
  if (isAudioMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(980, now + 0.4);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.35);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.46);
  } catch {
    // Ignore audio error
  }
};

/**
 * 7. Laser Repair Beam Chirp
 */
export const playLaserRepairSound = () => {
  if (isAudioMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1800, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.12);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.14);
  } catch {
    // Ignore audio error
  }
};