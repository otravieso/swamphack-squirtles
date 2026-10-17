// Tests the notes → Gemini → database glue with a FAKE Gemini and a FAKE save,
// so they run offline: no API key, and nothing touches the shared PostgreSQL database.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStudyPackFromNotes, isUsableQuestion, MAX_NOTES_CHARS } from '../src/services/studyPacks.js';

const goodQuestion = {
  question: 'Where does photosynthesis happen?',
  options: ['Mitochondria', 'Chloroplasts', 'Nucleus', 'Ribosomes'],
  answerIndex: 1,
  explanation: 'Photosynthesis takes place in chloroplasts.',
  topic: 'Photosynthesis',
  difficulty: 1,
  sourceQuote: 'Photosynthesis takes place in chloroplasts.',
};

/** Stand-in for saveQuestionSet(): records calls, returns a set like the real one. */
function fakeStore() {
  const saved = [];
  const save = async (userId, set) => {
    const record = { id: saved.length + 1, userId, ...set };
    saved.push(record);
    return record;
  };
  return { saved, save };
}

test('generates and saves a set for the user, passing the notes to Gemini', async () => {
  const store = fakeStore();
  let receivedNotes;
  const generate = async (notes) => {
    receivedNotes = notes;
    return [goodQuestion, { ...goodQuestion, question: 'What pigment absorbs light?', answerIndex: 0 }];
  };
  const result = await createStudyPackFromNotes(
    'auth0|amy',
    { title: 'Bio', notes: '  Plants use chlorophyll.  ', sourceFiles: ['bio.txt'] },
    { generate, save: store.save }
  );
  assert.equal(receivedNotes, 'Plants use chlorophyll.');
  assert.equal(store.saved.length, 1);
  assert.equal(result.userId, 'auth0|amy');
  assert.equal(result.title, 'Bio');
  assert.deepEqual(result.sourceFiles, ['bio.txt']);
  assert.equal(result.questions.length, 2);
});

test('drops malformed questions from Gemini but keeps the good ones', async () => {
  const store = fakeStore();
  const generate = async () => [
    goodQuestion,
    { ...goodQuestion, answerIndex: 7 },
    { ...goodQuestion, options: ['only one'] },
    { question: '', options: ['a', 'b'], answerIndex: 0 },
    null,
  ];
  const result = await createStudyPackFromNotes('auth0|amy', { notes: 'x' }, { generate, save: store.save });
  assert.equal(result.questions.length, 1);
  assert.equal(result.title, 'Untitled notes');
});

test('rejects empty or huge notes without calling Gemini or saving', async () => {
  const store = fakeStore();
  let called = false;
  const generate = async () => { called = true; return [goodQuestion]; };
  await assert.rejects(createStudyPackFromNotes('u', { notes: '   ' }, { generate, save: store.save }), { status: 400 });
  await assert.rejects(
    createStudyPackFromNotes('u', { notes: 'a'.repeat(MAX_NOTES_CHARS + 1) }, { generate, save: store.save }),
    { status: 413 }
  );
  assert.equal(called, false);
  assert.equal(store.saved.length, 0);
});

test('Gemini failures become clean errors and nothing is saved', async () => {
  const store = fakeStore();
  const fail = (msg) => async () => { throw new Error(msg); };
  await assert.rejects(createStudyPackFromNotes('u', { notes: 'x' }, { generate: fail('boom'), save: store.save }), { status: 502 });
  await assert.rejects(
    createStudyPackFromNotes('u', { notes: 'x' }, { generate: fail('429 RESOURCE_EXHAUSTED'), save: store.save }),
    { status: 503 }
  );
  await assert.rejects(createStudyPackFromNotes('u', { notes: 'x' }, { generate: async () => [], save: store.save }), { status: 502 });
  assert.equal(store.saved.length, 0);
});

test('waits for the (async) database save to finish', async () => {
  let finished = false;
  const save = async (_u, set) => {
    await new Promise((r) => setTimeout(r, 20));
    finished = true;
    return { id: 1, ...set };
  };
  await createStudyPackFromNotes('u', { notes: 'x' }, { generate: async () => [goodQuestion], save });
  assert.equal(finished, true);
});

test('isUsableQuestion accepts the shape generateQuestions() returns', () => {
  assert.equal(isUsableQuestion(goodQuestion), true);
  assert.equal(isUsableQuestion({ ...goodQuestion, answerIndex: -1 }), false);
});
