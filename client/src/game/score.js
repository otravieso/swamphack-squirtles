// Oregon Trail-style final score: points for what you still have when the chapter ends.
// Intellect is worth the most; health, hunger and thirst matter too because running
// any of them out ends the game. Plain JavaScript (no UI) so any screen can use it.
//
//   import { computeScore } from './game/score.js';
//   <GameApp hooks={{
//     onEnd:   ({ stats })        => show(computeScore(stats, { completed: true })),
//     onDeath: ({ cause, stats }) => show(computeScore(stats, { completed: false })),
//   }} />
//
// `stats` is the snapshot the game passes to its hooks: { intelligence, health, hunger, thirst, beats }.

export const SCORE_WEIGHTS = {
  intelligence: 100, // intellect: the most important stat (max 5 × 100 = 500)
  health: 40,        // max 5 × 40 = 200
  hunger: 30,        // starts at 2 → max 60
  thirst: 30,        // starts at 3 → max 90
};

// Bonus for reaching the end of the chapter (the library exit) instead of dying on the way.
export const COMPLETION_BONUS = 250;

const clampStat = (v) => (Number.isFinite(v) ? Math.max(0, v) : 0);

/**
 * @param {{ intelligence: number, health: number, hunger: number, thirst: number }} stats
 * @param {{ completed: boolean }} outcome  completed = reached the end; false = died
 * @returns {{ total: number, breakdown: { intellect: number, health: number, hunger: number, thirst: number, completion: number } }}
 */
export function computeScore(stats = {}, { completed = false } = {}) {
  const breakdown = {
    intellect: clampStat(stats.intelligence) * SCORE_WEIGHTS.intelligence,
    health: clampStat(stats.health) * SCORE_WEIGHTS.health,
    hunger: clampStat(stats.hunger) * SCORE_WEIGHTS.hunger,
    thirst: clampStat(stats.thirst) * SCORE_WEIGHTS.thirst,
    completion: completed ? COMPLETION_BONUS : 0,
  };
  const total = Object.values(breakdown).reduce((sum, points) => sum + points, 0);
  return { total, breakdown };
}
