// Game audio, synthesized with the Web Audio API — no sound files needed.
const STORAGE_KEY = 'squirtles:muted';
const MASTER = 0.5;

let ctx = null, master = null, ambience = null, aggro = 0, blipCount = 0;
let muted = (() => { try { return localStorage.getItem(STORAGE_KEY) === '1'; } catch { return false; } })();
const listeners = new Set();

function audio() {
  if (ctx) return ctx;
  const AC = globalThis.AudioContext ?? globalThis.webkitAudioContext;
  if (!AC) return null;
  try {
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : MASTER;
    master.connect(ctx.destination);
  } catch { ctx = null; }
  return ctx;
}

function wake() {
  const c = audio();
  if (c && c.state === 'suspended') c.resume().catch(() => {});
  return c;
}

function tone({ freq, type = 'sine', at = 0, dur = 0.15, vol = 0.2, slide = null, detune = 0 }) {
  const c = wake();
  if (!c || muted) return;
  const t = c.currentTime + at;
  const osc = c.createOscillator();
  const env = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slide) osc.frequency.exponentialRampToValueAtTime(slide, t + dur);
  osc.detune.value = detune;
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(env).connect(master);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

function noise({ at = 0, dur = 0.4, vol = 0.15, from = 400, to = 2000, q = 1, type = 'bandpass' }) {
  const c = wake();
  if (!c || muted) return;
  const t = c.currentTime + at;
  const length = Math.ceil(c.sampleRate * dur);
  const buffer = c.createBuffer(1, length, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = type;
  filter.Q.value = q;
  filter.frequency.setValueAtTime(from, t);
  filter.frequency.exponentialRampToValueAtTime(to, t + dur);
  const env = c.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(vol, t + dur * 0.3);
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(filter).connect(env).connect(master);
  src.start(t);
  src.stop(t + dur + 0.05);
}

const EFFECTS = {
  advance: () => tone({ freq: 660, type: 'triangle', dur: 0.06, vol: 0.08 }),
  select: () => { tone({ freq: 520, type: 'triangle', dur: 0.08, vol: 0.12 }); tone({ freq: 780, type: 'triangle', at: 0.05, dur: 0.1, vol: 0.1 }); },
  correct: () => [523.25, 659.25, 783.99].forEach((freq, i) => tone({ freq, type: 'triangle', at: i * 0.09, dur: 0.3, vol: 0.16 })),
  wrong: () => {
    tone({ freq: 220, type: 'sawtooth', dur: 0.35, vol: 0.12, slide: 140 });
    tone({ freq: 233, type: 'sawtooth', dur: 0.35, vol: 0.1, slide: 147 });
  },
  hurt: () => { noise({ dur: 0.25, vol: 0.2, from: 300, to: 80, type: 'lowpass' }); tone({ freq: 110, dur: 0.25, vol: 0.25, slide: 55 }); },
  scene: () => noise({ dur: 0.7, vol: 0.06, from: 300, to: 3000, q: 0.7 }),
  death: () => {
    noise({ dur: 1.6, vol: 0.12, from: 4000, to: 200, q: 0.5 });
    [392, 370, 311, 220].forEach((freq, i) => tone({ freq, type: 'sawtooth', at: i * 0.32, dur: 0.6, vol: 0.13, detune: i * 15 }));
    tone({ freq: 55, at: 1.2, dur: 2, vol: 0.3, slide: 30 });
  },
  complete: () => [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => tone({ freq, type: 'triangle', at: i * 0.12, dur: 0.5, vol: 0.14 })),
};

function buildAmbience() {
  const c = audio();
  if (!c) return null;
  const bus = c.createGain(); bus.gain.value = 0;
  const filter = c.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 900;
  const lfo = c.createOscillator(), lfoDepth = c.createGain(), trem = c.createGain();
  lfo.frequency.value = 0.15; lfoDepth.gain.value = 0.15; trem.gain.value = 0.85;
  lfo.connect(lfoDepth).connect(trem.gain);
  const layers = { calm: c.createGain(), creepy: c.createGain() };
  layers.calm.gain.value = 1; layers.creepy.gain.value = 0;
  const voices = [
    ...[110, 164.81, 220, 277.18].map(f => ({ f, type: 'sine', layer: 'calm', vol: 0.05 })),
    ...[55, 77.78, 82.41, 116.54].map(f => ({ f, type: 'sawtooth', layer: 'creepy', vol: 0.035 })),
  ];
  const oscs = voices.map(({ f, type, layer, vol }) => {
    const osc = c.createOscillator();
    osc.type = type; osc.frequency.value = f; osc.detune.value = (Math.random() - 0.5) * 12;
    const g = c.createGain(); g.gain.value = vol;
    osc.connect(g).connect(layers[layer]);
    return osc;
  });
  layers.calm.connect(filter); layers.creepy.connect(filter);
  filter.connect(trem).connect(bus).connect(master);
  [lfo, ...oscs].forEach(o => o.start());
  return { bus, filter, lfo, layers, oscs: [lfo, ...oscs] };
}

function applyAggro(seconds = 2) {
  if (!ambience || !ctx) return;
  const t = ctx.currentTime, level = aggro / 3;
  const ramp = (p, v) => { p.cancelScheduledValues(t); p.setValueAtTime(p.value, t); p.linearRampToValueAtTime(v, t + seconds); };
  ramp(ambience.layers.calm.gain, 1 - level);
  ramp(ambience.layers.creepy.gain, level);
  ramp(ambience.filter.frequency, 900 - level * 500);
  ramp(ambience.lfo.frequency, 0.15 + level * 5);
}

export const sound = {
  get muted() { return muted; },
  setMuted(value) {
    muted = Boolean(value);
    try { localStorage.setItem(STORAGE_KEY, muted ? '1' : '0'); } catch {}
    if (master && ctx) master.gain.setTargetAtTime(muted ? 0 : MASTER, ctx.currentTime, 0.05);
    if (!muted) wake();
    listeners.forEach(fn => fn(muted));
  },
  onMutedChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  start() {
    const c = wake();
    if (!c || ambience) return;
    ambience = buildAmbience();
    if (!ambience) return;
    ambience.bus.gain.setTargetAtTime(1, c.currentTime, 1.5);
    applyAggro(0);
  },
  stop() {
    if (!ambience || !ctx) return;
    const { bus, oscs } = ambience;
    ambience = null;
    const t = ctx.currentTime;
    bus.gain.setTargetAtTime(0, t, 0.3);
    oscs.forEach(o => { try { o.stop(t + 1.5); } catch {} });
  },
  setAggro(level) {
    const next = Math.max(0, Math.min(3, Number(level) || 0));
    if (next === aggro) return;
    aggro = next;
    applyAggro();
  },
  blip(who, char) {
    if (muted || !char || /\s/.test(char)) return;
    if (blipCount++ % 2) return;
    const jitter = 1 + (Math.random() - 0.5) * 0.12;
    if (who === 'teacher') tone({ freq: (420 - aggro * 70) * jitter, type: 'square', dur: 0.045, vol: 0.05, detune: aggro * (Math.random() - 0.5) * 120 });
    else if (who === 'narrator') tone({ freq: 1400 * jitter, dur: 0.02, vol: 0.025 });
    else tone({ freq: 300 * jitter, type: 'triangle', dur: 0.035, vol: 0.05 });
  },
  play(name) { if (!muted) EFFECTS[name]?.(); },
};