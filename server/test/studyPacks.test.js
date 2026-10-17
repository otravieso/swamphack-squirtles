// Tests the notes → Gemini → database glue with a FAKE Gemini,
// so they run offline and never use the API key.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openDatabase } from '../src/db/db.js';
import { upsertUser } from '../src/db/users.js';
import { listQuestionSets } from '../src/db/questionSets.js';
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

function setup() {
  const db = openDatabase(':memory:');
  upsertUser({ id: 'auth0|amy', username: 'amy' }, db);
  return db;
}

test('generates and saves a set for the user, passing the notes to Gemini', async () => {
  const db = setup();
  let receivedNotes;
  const generate = async (notes) => {
    receivedNotes = notes;
    return [goodQuestion, { ...goodQuestion, question: 'What pigment absorbs light?', answerIndex: 0 }];
  };
  const saved = await createStudyPackFromNotes(
    'auth0|amy',
    { title: 'Bio', notes: '  Plants use chlorophyll.  ', sourceFiles: ['bio.txt'] },
    { generate, db }
  );
  assert.equal(receivedNotes, 'Plants use chlorophyll.');
  assert.equal(saved.title, 'Bio');
  assert.deepEqual(saved.sourceFiles, ['bio.txt']);
  assert.equal(saved.questions.length, 2);
  assert.equal(saved.questions[0].sourceQuote, goodQuestion.sourceQuote);
  assert.equal(listQuestionSets('auth0|amy', db).length, 1);
});

test('drops malformed questions from Gemini but keeps the good ones', async () => {
  const db = setup();
  const generate = async () => [
    goodQuestion,
    { ...goodQuestion, answerIndex: 7 },
    { ...goodQuestion, options: ['only one'] },
    { question: '', options: ['a', 'b'], answerIndex: 0 },
    null,
  ];
  const saved = await createStudyPackFromNotes('auth0|amy', { notes: 'x' }, { generate, db });
  assert.equal(saved.questions.length, 1);
  assert.equal(saved.title, 'Untitled notes');
});

test('rejects empty or huge notes without calling Gemini', async () => {
  const db = setup();
  let called = false;
  const generate = async () => { called = true; return [goodQuestion]; };
  await assert.rejects(createStudyPackFromNotes('auth0|amy', { notes: '   ' }, { generate, db }), { status: 400 });
  await assert.rejects(
    createStudyPackFromNotes('auth0|amy', { notes: 'a'.repeat(MAX_NOTES_CHARS + 1) }, { generate, db }),
    { status: 413 }
  );
  assert.equal(called, false);
});

test('Gemini failures become clean errors and nothing is saved', async () => {
  const db = setup();
  await assert.rejects(
    createStudyPackFromNotes('auth0|amy', { notes: 'x' }, { generate: async () => { throw new Error('boom'); }, db }),
    { status: 502 }
  );
  await assert.rejects(
    createStudyPackFromNotes('auth0|amy', { notes: 'x' }, { generate: async () => { throw new Error('429 RESOURCE_EXHAUSTED'); }, db }),
    { status: 503 }
  );
  await assert.rejects(
    createStudyPackFromNotes('auth0|amy', { notes: 'x' }, { generate: async () => [], db }),
    { status: 502 }
  );
  assert.equal(listQuestionSets('auth0|amy', db).length, 0);
});

test('isUsableQuestion accepts the shape generateQuestions() returns', () => {
  assert.equal(isUsableQuestion(goodQuestion), true);
  assert.equal(isUsableQuestion({ ...goodQuestion, answerIndex: -1 }), false);
});
