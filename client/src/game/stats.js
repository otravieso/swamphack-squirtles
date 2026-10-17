export const MAX = { intelligence: 5, health: 5, thirst: 5, hunger: 5 };
// intelligence = intellect. Starting values are set so every stat can be lost through bad decisions
// in the script (worst case: health -6, thirst -4, hunger -2, intellect -1 per wrong answer).
export const START = { intelligence: 5, health: 5, thirst: 3, hunger: 2 };
// Automatic hunger/thirst loss every N questions. 0 = off: only the script's decisions change stats.
export const DECAY_EVERY = 0;

export class Stats {
  constructor(init = START) { this.v = { ...init }; this.beats = 0; this.subs = []; }
  apply(fx = {}) {
    for (const [key, delta] of Object.entries(fx)) {
      if (Object.hasOwn(this.v, key) && Number.isFinite(delta)) {
        this.v[key] = Math.max(0, Math.min(MAX[key], this.v[key] + delta));
      }
    }
    this.subs.forEach(fn => fn(this.snapshot()));
  }
  tick() {
    this.beats++;
    if (DECAY_EVERY > 0 && this.beats % DECAY_EVERY === 0) this.apply({ thirst: -1, hunger: -1 });
  }
  get dead() { return Object.keys(this.v).find(key => this.v[key] <= 0) ?? null; }
  snapshot() { return { ...this.v, beats: this.beats }; }
  onChange(fn) { this.subs.push(fn); return () => { this.subs = this.subs.filter(f => f !== fn); }; }
}
