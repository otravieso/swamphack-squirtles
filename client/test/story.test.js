// Checks the story script's structure and plays it through with different decisions,
// using the real stats rules (same order of effects as GameApp: choice fx first, then its lines;
// a wrong answer costs 1 intellect after the Professor's reaction).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { story } from '../src/game/story.js';
import { Stats, START } from '../src/game/stats.js';
import { computeScore } from '../src/game/score.js';

const STAT_KEYS = ['intelligence', 'health', 'hunger', 'thirst'];

/**
 * Play the whole story. `pick(choiceNumber, options)` returns the option index for each choice;
 * `answer(questionNumber)` returns true (correct) or false (wrong).
 * Returns { outcome: 'completed' | 'died', cause, stats, questionsAsked }.
 */
function play({ pick = () => 0, answer = () => true } = {}) {
  const stats = new Stats();
  let choiceNo = 0;
  let questionNo = 0;
  const run = (nodes) => {
    for (const node of nodes) {
      if (node.t === 'choice') {
        const option = node.options[pick(choiceNo++, node.options)];
        stats.apply(option.fx);
        if (stats.dead) return 'died';
        if (run(option.then ?? []) === 'died') return 'died';
      } else if (node.t === 'q') {
        const correct = answer(questionNo++);
        if (run(correct ? node.right : node.wrong) === 'died') return 'died';
        if (!correct) stats.apply({ intelligence: -1 });
        stats.tick();
        if (stats.dead) return 'died';
      } else if (node.t === 'end') {
        return 'completed';
      }
    }
    return 'completed';
  };
  const outcome = run(story);
  return { outcome, cause: stats.dead, stats: stats.snapshot(), questionsAsked: questionNo };
}

// Option indexes by label text, so tests read like decisions.
const byLabel = (...wanted) => (_n, options) => {
  const i = options.findIndex((o) => wanted.some((w) => o.label.startsWith(w)));
  return i === -1 ? 0 : i;
};

test('structure: 14 question spots, valid choices and effects, ends with the 404 screen', () => {
  let questions = 0;
  const walk = (nodes) => nodes.forEach((n) => {
    assert.ok(['scene', 'say', 'q', 'choice', 'end'].includes(n.t), `unknown node ${n.t}`);
    if (n.t === 'say') {
      assert.ok(n.text.trim(), 'empty line');
      assert.equal((n.text.match(/\*/g) ?? []).length % 2, 0, `unbalanced glitch *…* in: ${n.text}`);
    }
    if (n.t === 'q') { questions++; walk(n.right); walk(n.wrong); }
    if (n.t === 'choice') {
      assert.ok(n.options.length >= 2);
      n.options.forEach((o) => {
        assert.ok(o.label.trim());
        Object.entries(o.fx).forEach(([k, v]) => {
          assert.ok(STAT_KEYS.includes(k), `unknown stat ${k}`);
          assert.ok(Number.isInteger(v));
        });
        walk(o.then ?? []);
      });
    }
  });
  walk(story);
  assert.equal(questions, 14);
  assert.equal(story.at(-1).t, 'end');
  assert.equal(story.at(-1).text, '404 Exit Not Found…');
});

test('no timer: stats only change through decisions and answers', () => {
  const s = new Stats();
  for (let i = 0; i < 20; i++) s.tick();
  assert.deepEqual({ ...s.snapshot(), beats: undefined }, { ...START, beats: undefined });
});

const SAFE = byLabel('Get to the sink', 'Carefully descend', 'Canned beans', 'Gatorade', 'You quietly walk', 'Yes');

test('perfect run: safe choices + every answer right = full stats and max score', () => {
  const r = play({ pick: SAFE, answer: () => true });
  assert.equal(r.outcome, 'completed');
  assert.equal(r.questionsAsked, 14);
  assert.deepEqual([r.stats.intelligence, r.stats.health, r.stats.hunger, r.stats.thirst], [5, 5, 2, 3]);
  assert.equal(computeScore(r.stats, { completed: true }).total, 1100);
});

test('health can be lost: water bottle, running the stairs, egg salad, robo fuel', () => {
  const r = play({ pick: byLabel('Go to the window', 'Run down', 'EggSalad', 'Robo fuel'), answer: () => true });
  assert.equal(r.outcome, 'died');
  assert.equal(r.cause, 'health');
});

test('thirst can be lost: licking the desk, the railing, lasagna, the nugget drink', () => {
  const r = play({ pick: byLabel('You lick', 'Use the broken railing', 'Lasagna', 'Suspicious nugget'), answer: () => true });
  assert.equal(r.outcome, 'died');
  assert.equal(r.cause, 'thirst');
});

test('hunger can be lost: the window ledge plus the egg salad', () => {
  const r = play({ pick: byLabel('Get to the sink', 'Climb out the window', 'EggSalad'), answer: () => true });
  assert.equal(r.outcome, 'died');
  assert.equal(r.cause, 'hunger');
});

test('intellect is lost by wrong answers: 5 wrong answers ends the game', () => {
  const r = play({ pick: SAFE, answer: (n) => n >= 5 });
  assert.equal(r.outcome, 'died');
  assert.equal(r.cause, 'intelligence');
  assert.equal(r.questionsAsked, 5);
});

test('a few mistakes still finish the chapter with a lower score', () => {
  const r = play({ pick: byLabel('Go to the window', 'Carefully descend', 'Lasagna', 'Gatorade', 'You sprint'), answer: (n) => n % 4 !== 0 });
  assert.equal(r.outcome, 'completed');
  const { total, breakdown } = computeScore(r.stats, { completed: true });
  assert.ok(total < 1100 && total > 250, `score ${total}`);
  assert.equal(breakdown.intellect, r.stats.intelligence * 100);
});
