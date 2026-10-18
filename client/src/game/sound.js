// Game audio, synthesized with the Web Audio API — no sound files needed.
const STORAGE_KEY = 'squirtles:muted';
const MASTER = 0.5;

let ctx = null, master = null, ambience = null, aggro = 0, blipCount = 0;
let redTimers = [];
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

function tone({ freq, type = 'sine', at = 0, dur = 0.15, vol = 0.2, slide = null, detune = 0, out = null, attack = 0.01 }) {
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
  env.gain.exponentialRampToValueAtTime(vol, t + attack);
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(env).connect(out ?? master);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

function noiseBuffer(c, seconds) {
  const length = Math.ceil(c.sampleRate * seconds);
  const buffer = c.createBuffer(1, length, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

function noise({ at = 0, dur = 0.4, vol = 0.15, from = 400, to = 2000, q = 1, type = 'bandpass', out = null }) {
  const c = wake();
  if (!c || muted) return;
  const t = c.currentTime + at;
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c, dur);
  const filter = c.createBiquadFilter();
  filter.type = type;
  filter.Q.value = q;
  filter.frequency.setValueAtTime(from, t);
  filter.frequency.exponentialRampToValueAtTime(to, t + dur);
  const env = c.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(vol, t + dur * 0.3);
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(filter).connect(env).connect(out ?? master);
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

// Soft clipping curve for the distorted red-screen drone.
function distortionCurve(amount = 40) {
  const curve = new Float32Array(1024);
  for (let i = 0; i < curve.length; i++) {
    const x = (i / (curve.length - 1)) * 2 - 1;
    curve[i] = ((1 + amount) * x) / (1 + amount * Math.abs(x));
  }
  return curve;
}

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

  // --- Red screen layer: only audible at max aggro. ---
  const red = c.createGain(); red.gain.value = 0;
  red.connect(master);
  // 1) Low rumble, like a huge building breathing.
  const hiss = c.createBufferSource();
  hiss.buffer = noiseBuffer(c, 2); hiss.loop = true;
  const hissFilter = c.createBiquadFilter(); hissFilter.type = 'lowpass'; hissFilter.frequency.value = 140;
  const hissGain = c.createGain(); hissGain.gain.value = 0.35;
  const flutter = c.createOscillator(), flutterDepth = c.createGain();
  flutter.frequency.value = 0.12; flutterDepth.gain.value = 0.2;
  flutter.connect(flutterDepth).connect(hissGain.gain);
  hiss.connect(hissFilter).connect(hissGain).connect(red);
  // 2) Distorted, grinding low drone.
  const shaper = c.createWaveShaper(); shaper.curve = distortionCurve(60);
  const grindFilter = c.createBiquadFilter(); grindFilter.type = 'lowpass'; grindFilter.frequency.value = 220;
  const grindGain = c.createGain(); grindGain.gain.value = 0.09;
  const grind = [41.2, 43.65, 61.74].map(f => {
    const osc = c.createOscillator();
    osc.type = 'sawtooth'; osc.frequency.value = f;
    osc.connect(shaper);
    return osc;
  });
  shaper.connect(grindFilter).connect(grindGain).connect(red);
  // 3) Sub-bass that slowly swells and fades, felt more than heard.
  const whine = c.createOscillator(), whineGain = c.createGain(), wobble = c.createOscillator(), wobbleDepth = c.createGain();
  whine.type = 'sine'; whine.frequency.value = 32.7; whineGain.gain.value = 0.18;
  wobble.frequency.value = 0.08; wobbleDepth.gain.value = 0.16;
  wobble.connect(wobbleDepth).connect(whineGain.gain);
  whine.connect(whineGain).connect(red);

  // 4) "Far away" bus for distant machine noises: muffled + echoing down a long hall.
  const far = c.createGain(); far.gain.value = 1;
  const farFilter = c.createBiquadFilter(); farFilter.type = 'lowpass'; farFilter.frequency.value = 380;
  const echo = c.createDelay(2); echo.delayTime.value = 0.6;
  const echoFeedback = c.createGain(); echoFeedback.gain.value = 0.55;
  const echoFilter = c.createBiquadFilter(); echoFilter.type = 'lowpass'; echoFilter.frequency.value = 250;
  far.connect(farFilter);
  farFilter.connect(red);
  farFilter.connect(echo);
  echo.connect(echoFilter).connect(echoFeedback).connect(echo);
  echoFilter.connect(red);

  const all = [lfo, ...oscs, hiss, flutter, ...grind, whine, wobble];
  all.forEach(o => o.start());
  return { bus, filter, lfo, layers, red, far, oscs: all };
}

// Distant machinery, played through the muffled echo bus.
const MACHINES = [
  // Heavy metal clank: clashing, out-of-tune partials.
  (out) => {
    const base = 55 + Math.random() * 30;
    [1, 2.76, 5.4].forEach((m, i) => tone({ freq: base * m, type: 'triangle', dur: 2 - i * 0.4, vol: 0.3 / (i + 1), out }));
    noise({ dur: 0.2, vol: 0.3, from: 400, to: 80, q: 1, type: 'lowpass', out });
  },
  // Servo motor whirring up, then winding down.
  (out) => {
    const f = 70 + Math.random() * 40;
    tone({ freq: f, type: 'sawtooth', dur: 1.6, vol: 0.14, slide: f * 1.8, attack: 0.4, out });
    tone({ freq: f * 1.8, type: 'sawtooth', at: 1.5, dur: 1.8, vol: 0.12, slide: f * 0.7, out });
  },
  // Piston: three slow, heavy thuds with a hiss of steam.
  (out) => {
    [0, 0.55, 1.1].forEach(at => tone({ freq: 48, at, dur: 0.35, vol: 0.5, slide: 30, out }));
    noise({ at: 1.5, dur: 1.5, vol: 0.15, from: 900, to: 300, q: 0.6, out });
  },
  // Distant foghorn-like BWOOOM: a low chord that swells in slowly and dies away.
  (out) => {
    const root = [36.71, 32.7, 41.2][Math.floor(Math.random() * 3)];
    [1, 1.5, 2].forEach((m, i) => tone({ freq: root * m, type: 'sawtooth', dur: 6, attack: 1.8, vol: 0.22 / (i + 1), slide: root * m * 0.97, out }));
  },
  // Deep boom far below, like something massive dropped a floor down.
  (out) => {
    tone({ freq: 45, dur: 3, vol: 0.6, slide: 25, out });
    noise({ dur: 2, vol: 0.4, from: 200, to: 40, type: 'lowpass', out });
  },
  // Something enormous groaning, metal under strain.
  (out) => {
    const f = 35 + Math.random() * 15;
    tone({ freq: f, type: 'sawtooth', dur: 2.5, vol: 0.2, slide: f * 0.7, out });
    tone({ freq: f * 1.06, type: 'sawtooth', dur: 2.5, vol: 0.15, slide: f * 0.74, out });
  },
];

let nextMachineAt = 0;
function distantMachine() {
  if (aggro < 3 || muted || !ambience || !ctx) return;
  const now = ctx.currentTime;
  if (now < nextMachineAt) return;
  MACHINES[Math.floor(Math.random() * MACHINES.length)](ambience.far);
  nextMachineAt = now + 3.5 + Math.random() * 4; // every 3.5–7.5 seconds
}

// Heartbeat thumps and random distant knocks while the screen is red.
function startRedTimers() {
  stopRedTimers();
  const heartbeat = setInterval(() => {
    if (aggro < 3 || muted) return;
    tone({ freq: 62, dur: 0.18, vol: 0.35, slide: 40 });
    tone({ freq: 58, at: 0.24, dur: 0.22, vol: 0.28, slide: 38 });
  }, 850);
  const glitch = setInterval(() => {
    if (aggro < 3 || muted || Math.random() > 0.12) return;
    tone({ freq: 70 + Math.random() * 40, type: 'triangle', dur: 0.12, vol: 0.12, slide: 50, out: ambience?.far });
  }, 300);
  const machines = setInterval(distantMachine, 500);
  redTimers = [heartbeat, glitch, machines];
}

function stopRedTimers() {
  redTimers.forEach(clearInterval);
  redTimers = [];
}

function applyAggro(seconds = 2) {
  if (!ambience || !ctx) return;
  const t = ctx.currentTime, level = aggro / 3;
  const ramp = (p, v) => { p.cancelScheduledValues(t); p.setValueAtTime(p.value, t); p.linearRampToValueAtTime(v, t + seconds); };
  ramp(ambience.layers.calm.gain, 1 - level);
  ramp(ambience.layers.creepy.gain, level * (aggro === 3 ? 1.6 : 1));
  ramp(ambience.filter.frequency, aggro === 3 ? 1400 : 900 - level * 500);
  ramp(ambience.lfo.frequency, 0.15 + level * 5);
  ramp(ambience.red.gain, aggro === 3 ? 1 : 0);
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
    startRedTimers();
  },
  stop() {
    stopRedTimers();
    if (!ambience || !ctx) return;
    const { bus, red, oscs } = ambience;
    ambience = null;
    const t = ctx.currentTime;
    bus.gain.setTargetAtTime(0, t, 0.3);
    red.gain.setTargetAtTime(0, t, 0.3);
    oscs.forEach(o => { try { o.stop(t + 1.5); } catch {} });
  },
  setAggro(level) {
    const next = Math.max(0, Math.min(3, Number(level) || 0));
    if (next === aggro) return;
    aggro = next;
    applyAggro(aggro === 3 ? 1 : 2);
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