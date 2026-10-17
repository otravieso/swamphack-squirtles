export const MAX = { intelligence: 5, health: 5, thirst: 5, hunger: 5 };
export const START = { intelligence: 5, health: 5, thirst: 3, hunger: 3 };
export const DECAY_EVERY = 2;

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
    if (this.beats % DECAY_EVERY === 0) this.apply({ thirst: -1, hunger: -1 });
  }
  get dead() { return Object.keys(this.v).find(key => this.v[key] <= 0) ?? null; }
  snapshot() { return { ...this.v, beats: this.beats }; }
  onChange(fn) { this.subs.push(fn); return () => { this.subs = this.subs.filter(f => f !== fn); }; }
}
