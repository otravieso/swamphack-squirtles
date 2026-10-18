// The question mix and the per-type clean-up (no Gemini call needed).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { QUESTION_MIX, makeTypePlan, normalizeQuestion } from '../src/gemini/questionMix.js';

const count = (items) => items.reduce((acc, x) => ({ ...acc, [x]: (acc[x] ?? 0) + 1 }), {});

test('every round has exactly the fixed mix: 5 multiple choice, 2 true/false, 3 fill-in', () => {
  assert.deepEqual(QUESTION_MIX, { multipleChoice: 5, trueFalse: 2, fillInBlank: 3 });
  for (let i = 0; i < 50; i++) {
    const plan = makeTypePlan();
    assert.equal(plan.length, 10);
    assert.deepEqual(count(plan), { multipleChoice: 5, trueFalse: 2, fillInBlank: 3 });
  }
});

test('the order of types changes between rounds', () => {
  const orders = new Set(Array.from({ length: 20 }, () => makeTypePlan().join(',')));
  assert.ok(orders.size > 1);
});

test('a bigger mix later just means bigger numbers', () => {
  const plan = makeTypePlan({ multipleChoice: 7, trueFalse: 3, fillInBlank: 4 });
  assert.equal(plan.length, 14);
});

test('true/false always becomes options ["True", "False"] with the right answer', () => {
  const q = normalizeQuestion({ type: 'trueFalse', question: 'Chlorophyll absorbs light.', options: ['false', 'TRUE'], answerIndex: 1 });
  assert.deepEqual(q.options, ['True', 'False']);
  assert.equal(q.answerIndex, 0);
  const f = normalizeQuestion({ type: 'trueFalse', question: 'Plants exhale CO2 only.', options: ['True', 'False'], answerIndex: 1 });
  assert.equal(f.answerIndex, 1);
  assert.equal(normalizeQuestion({ type: 'trueFalse', question: 'x', options: ['Yes', 'No'], answerIndex: 0 }), null);
});

test('fill-in needs a blank and 4 options; the answer survives shuffling', () => {
  for (let i = 0; i < 30; i++) {
    const q = normalizeQuestion({
      type: 'fillInBlank',
      question: 'Fill in the blank: Photosynthesis happens in the ________.',
      options: ['chloroplasts', 'chromosomes', 'mitochondria', 'chlorophyll'],
      answerIndex: 0,
    });
    assert.equal(q.question, 'Fill in the blank: Photosynthesis happens in the _____.');
    assert.equal(q.options.length, 4);
    assert.equal(q.options[q.answerIndex], 'chloroplasts');
  }
  assert.equal(normalizeQuestion({ type: 'fillInBlank', question: 'No blank here', options: ['a', 'b', 'c', 'd'], answerIndex: 0 }), null);
});

test('multiple choice is shuffled so the answer is not always in the same place', () => {
  const positions = new Set();
  for (let i = 0; i < 40; i++) {
    const q = normalizeQuestion({ type: 'multipleChoice', question: 'Q?', options: ['right', 'w1', 'w2', 'w3'], answerIndex: 0 });
    assert.equal(q.options[q.answerIndex], 'right');
    positions.add(q.answerIndex);
  }
  assert.ok(positions.size > 1);
});

test('broken questions are dropped', () => {
  assert.equal(normalizeQuestion(null), null);
  assert.equal(normalizeQuestion({ type: 'multipleChoice', question: 'Q?', options: ['a', 'b', 'c'], answerIndex: 0 }), null);
  assert.equal(normalizeQuestion({ type: 'multipleChoice', question: 'Q?', options: ['a', 'A', 'c', 'd'], answerIndex: 0 }), null);
  assert.equal(normalizeQuestion({ type: 'multipleChoice', question: 'Q?', options: ['a', 'b', 'c', 'd'], answerIndex: 9 }), null);
  assert.equal(normalizeQuestion({ type: 'multipleChoice', question: '  ', options: ['a', 'b', 'c', 'd'], answerIndex: 0 }), null);
});
