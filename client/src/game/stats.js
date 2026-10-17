// Hidden survival stats. The player never sees these (unless ?debug is in the URL).
// Any stat reaching 0 = death.
export const MAX = { intelligence: 5, health: 5, thirst: 5, hunger: 5 };
export const START = { intelligence: 5, health: 5, thirst: 3, hunger: 3 };
export const DECAY_EVERY = 2; // thirst + hunger each drop 1 every N questions

export class Stats {
  constructor(init = START) { this.v = { ...init }; this.beats = 0; this.subs = []; }
  apply(fx = {}) {
    for (const [k, d] of Object.entries(fx))
      if (k in this.v) this.v[k] = Math.max(0, Math.min(MAX[k], this.v[k] + d));
    this.subs.forEach((f) => f(this.snapshot()));
  }
  tick() { if (++this.beats % DECAY_EVERY === 0) this.apply({ thirst: -1, hunger: -1 }); }
  get dead() { return Object.keys(this.v).find((k) => this.v[k] <= 0) || null; }
  snapshot() { return { ...this.v, beats: this.beats }; }
  onChange(fn) { this.subs.push(fn); }
}
