/**
 * Web Audio API synthesizer for classroom interaction sounds.
 * Synthesizes sound waves directly in the browser so no external asset files are required.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Play a high-contrast mechanical/wooden click sound during rolling
 */
export function playTickSound(volume: number = 0.5, pitchMultiplier: number = 1.0) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    const baseFreq = 520 * pitchMultiplier;
    osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.6, ctx.currentTime + 0.05);

    const now = ctx.currentTime;
    gain.gain.setValueAtTime(volume * 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.07);
  } catch {
    // Audio failure ignored gracefully
  }
}

/**
 * Play a low resonant tension click as it slows down
 */
export function playTensionClick(volume: number = 0.5) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(160, ctx.currentTime + 0.12);

    const now = ctx.currentTime;
    gain.gain.setValueAtTime(volume * 0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.13);
  } catch {
    // Audio failure ignored gracefully
  }
}

/**
 * Play celebratory victory fanfare chord with bright chime harmonics
 */
export function playCelebrationFanfare(volume: number = 0.5) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Major chord arpeggio into rich final harmony: C5 (523), E5 (659), G5 (784), C6 (1046)
    const notes = [
      { freq: 523.25, timeOffset: 0.0, duration: 0.25 },
      { freq: 659.25, timeOffset: 0.1, duration: 0.25 },
      { freq: 783.99, timeOffset: 0.2, duration: 0.35 },
      { freq: 1046.50, timeOffset: 0.32, duration: 0.75 },
      { freq: 1318.51, timeOffset: 0.35, duration: 0.75 }, // extra chime sparkle
    ];

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(volume * 0.6, ctx.currentTime);
    masterGain.connect(ctx.destination);

    notes.forEach(({ freq, timeOffset, duration }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + timeOffset);

      const startTime = ctx.currentTime + timeOffset;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.3, startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.05);
    });
  } catch {
    // Audio failure ignored gracefully
  }
}

/**
 * Play a smooth shuffling whoosh sound for grouping
 */
export function playShuffleSound(volume: number = 0.5) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const bufferSize = ctx.sampleRate * 0.25;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(2400, ctx.currentTime + 0.15);
    filter.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.25);
    filter.Q.setValueAtTime(3, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volume * 0.4, ctx.currentTime + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start();
    noise.stop(ctx.currentTime + 0.26);
  } catch {
    // Audio failure ignored gracefully
  }
}
