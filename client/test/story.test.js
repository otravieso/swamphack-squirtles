// Checks the story script's structure and plays it through with different decisions,
// using the real stats rules and the same order as GameApp:
//   choice:       stat change -> that choice's narration -> THEN death check
//   wrong answer: Professor's reaction -> intellect -1 + "Correct answer" explanation -> THEN death check
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
  const shown = []; // every line displayed, in order
  let choiceNo = 0;
  let questionNo = 0;
  const run = (nodes) => {
    for (const node of nodes) {
      if (node.t === 'say') {
        shown.push(node.text);
      } else if (node.t === 'choice') {
        const option = node.options[pick(choiceNo++, node.options)];
        stats.apply(option.fx);
        if (run(option.then ?? []) === 'died') return 'died';
        if (stats.dead) return 'died'; // death check AFTER the choice's narration
      } else if (node.t === 'q') {
        const correct = answer(questionNo++);
        shown.push('[question]');
        if (run(correct ? node.right : node.wrong) === 'died') return 'died';
        if (!correct) { stats.apply({ intelligence: -1 }); shown.push('[Correct answer: …]'); }
        if (stats.dead) return 'died'; // death check AFTER the reaction + explanation
        stats.tick();
      } else if (node.t === 'end') {
        return 'completed';
      }
    }
    return 'completed';
  };
  const outcome = run(story);
  return { outcome, cause: stats.dead, stats: stats.snapshot(), questionsAsked: questionNo, lastShown: shown.at(-1) };
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
  const r = play({ pick: byLabel('Go to the window', 'Run down', 'Egg salad', 'Robo fuel'), answer: () => true });
  assert.equal(r.outcome, 'died');
  assert.equal(r.cause, 'health');
  assert.ok(r.lastShown.startsWith("It's dark and thick."), 'robo fuel narration shown before game over: ' + r.lastShown);
});

test('thirst can be lost: licking the desk, the railing, then lasagna (thirst 3 -> 0)', () => {
  const r = play({ pick: byLabel('You lick', 'Use the broken railing', 'Lasagna'), answer: () => true });
  assert.equal(r.outcome, 'died');
  assert.equal(r.cause, 'thirst');
  assert.ok(r.lastShown.startsWith('Oh, you think yourself somewhat of a builder?'), 'lasagna narration shown before game over: ' + r.lastShown);
});

test('thirst can also run out at the drinks machine (the nugget drink)', () => {
  const r = play({ pick: byLabel('You lick', 'Use the broken railing', 'Canned beans', 'Suspicious nugget'), answer: () => true });
  assert.equal(r.cause, 'thirst');
  assert.ok(r.lastShown.startsWith('A single nugget is dispensed.'), 'nugget narration shown before game over: ' + r.lastShown);
});

test('hunger can be lost: the window ledge plus the egg salad', () => {
  const r = play({ pick: byLabel('Get to the sink', 'Climb out the window', 'Egg salad'), answer: () => true });
  assert.equal(r.outcome, 'died');
  assert.equal(r.cause, 'hunger');
  assert.ok(r.lastShown.startsWith('You died. Or rather'), 'egg salad narration shown before game over: ' + r.lastShown);
});

test('intellect is lost by wrong answers: 5 wrong answers ends the game', () => {
  const r = play({ pick: SAFE, answer: (n) => n >= 5 });
  assert.equal(r.outcome, 'died');
  assert.equal(r.cause, 'intelligence');
  assert.equal(r.questionsAsked, 5);
  assert.equal(r.lastShown, '[Correct answer: …]', 'reaction + explanation shown before game over');
});

test('stats never change on their own: only decisions with effects and wrong answers move them', () => {
  const neutral = play({ pick: SAFE, answer: () => true });
  assert.deepEqual([neutral.stats.intelligence, neutral.stats.health, neutral.stats.hunger, neutral.stats.thirst],
    [START.intelligence, START.health, START.hunger, START.thirst]);
  const oneWrong = play({ pick: SAFE, answer: (n) => n !== 0 });
  assert.equal(oneWrong.stats.intelligence, START.intelligence - 1);
});

test('a few mistakes still finish the chapter with a lower score', () => {
  const r = play({ pick: byLabel('Go to the window', 'Carefully descend', 'Lasagna', 'Gatorade', 'You sprint'), answer: (n) => n % 4 !== 0 });
  assert.equal(r.outcome, 'completed');
  const { total, breakdown } = computeScore(r.stats, { completed: true });
  assert.ok(total < 1100 && total > 250, `score ${total}`);
  assert.equal(breakdown.intellect, r.stats.intelligence * 100);
});