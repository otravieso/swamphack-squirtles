import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toGameQuestion, makeQuestionSetProvider, loadQuestionSetIntoGame } from '../src/game/questionSetAdapter.js';
import { getQuestion } from '../src/game/questionProvider.js';
import { isPdfFile, titleFromFileName } from '../src/api/files.js';

const saved = {
  id: 7,
  title: 'Pipes',
  questions: [
    { id: 41, question: 'What does fork() return to the child?', options: ['0', 'PID', '-1', '1'], answerIndex: 0, explanation: 'The child gets 0.', topic: 'fork', difficulty: 2 },
    { id: 42, question: 'Which call creates a pipe?', options: ['open', 'pipe', 'dup', 'exec'], answerIndex: 1, explanation: null },
  ],
};

test('toGameQuestion maps database fields to the game contract', () => {
  assert.deepEqual(toGameQuestion(saved.questions[0]), {
    id: '41', prompt: 'What does fork() return to the child?', choices: ['0', 'PID', '-1', '1'], correctIndex: 0, explanation: 'The child gets 0.',
  });
  assert.equal(toGameQuestion(saved.questions[1]).explanation, undefined);
});

test('provider gives unseen questions in order, then repeats instead of failing', async () => {
  const provider = makeQuestionSetProvider(saved);
  assert.equal((await provider({ seen: [] })).id, '41');
  assert.equal((await provider({ seen: ['41'] })).id, '42');
  const repeat = await provider({ seen: ['41', '42'] });
  assert.ok(['41', '42'].includes(repeat.id));
});

test('empty sets are rejected', () => {
  assert.throws(() => makeQuestionSetProvider({ questions: [] }), /no questions/);
});

test('loadQuestionSetIntoGame makes the game ask the saved questions', async () => {
  loadQuestionSetIntoGame(saved);
  const q = await getQuestion({ difficulty: 0, seen: [] });
  assert.equal(q.prompt, 'What does fork() return to the child?');
});

test('file helpers', () => {
  assert.equal(isPdfFile({ name: 'a.PDF', type: '' }), true);
  assert.equal(isPdfFile({ name: 'a.txt', type: 'text/plain' }), false);
  assert.equal(titleFromFileName('Bio Ch 3.pdf'), 'Bio Ch 3');
});
