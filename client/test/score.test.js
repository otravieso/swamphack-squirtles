import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeScore, SCORE_WEIGHTS, COMPLETION_BONUS } from '../src/game/score.js';

test('intellect is weighted the most', () => {
  const others = ['health', 'hunger', 'thirst'].map((k) => SCORE_WEIGHTS[k]);
  assert.ok(others.every((w) => SCORE_WEIGHTS.intelligence > w));
});

test('perfect finish = 500 intellect + 200 health + 60 hunger + 90 thirst + 250 completion', () => {
  const r = computeScore({ intelligence: 5, health: 5, hunger: 2, thirst: 3 }, { completed: true });
  assert.deepEqual(r.breakdown, { intellect: 500, health: 200, hunger: 60, thirst: 90, completion: COMPLETION_BONUS });
  assert.equal(r.total, 1100);
});

test('dying gives no completion bonus', () => {
  const r = computeScore({ intelligence: 3, health: 0, hunger: 1, thirst: 2 }, { completed: false });
  assert.equal(r.breakdown.completion, 0);
  assert.equal(r.total, 300 + 0 + 30 + 60);
});

test('missing or negative values count as 0', () => {
  assert.equal(computeScore({ intelligence: -2 }).total, 0);
  assert.equal(computeScore().total, 0);
});
