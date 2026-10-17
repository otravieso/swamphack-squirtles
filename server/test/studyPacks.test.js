// Tests the notes → Gemini → database glue with a FAKE Gemini and a FAKE save,
// so they run offline: no API key, and nothing touches the shared PostgreSQL database.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStudyPackFromNotes, regenerateStudyPack, isUsableQuestion, MAX_NOTES_CHARS } from '../src/services/studyPacks.js';

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

// ── PDFs ─────────────────────────────────────────────────────────────
const pdfBase64 = Buffer.from('%PDF-1.4 fake pdf bytes').toString('base64');
const pdfFile = { name: 'Bio Chapter 3.pdf', mimeType: 'application/pdf', data: pdfBase64 };

test('PDF: Gemini reads it, its text goes to generateQuestions, file name is recorded', async () => {
  const store = fakeStore();
  let extractedFrom;
  let receivedNotes;
  const extract = async (file) => { extractedFrom = file; return '  Mitochondria make ATP.  '; };
  const generate = async (notes) => { receivedNotes = notes; return [goodQuestion]; };
  const result = await createStudyPackFromNotes('u', { file: pdfFile }, { extract, generate, save: store.save });
  assert.deepEqual(extractedFrom, { mimeType: 'application/pdf', data: pdfBase64 });
  assert.equal(receivedNotes, 'Mitochondria make ATP.');
  assert.equal(result.title, 'Bio Chapter 3'); // defaults to the file name
  assert.deepEqual(result.sourceFiles, ['Bio Chapter 3.pdf']);
});

test('PDF + typed notes are combined', async () => {
  let receivedNotes;
  await createStudyPackFromNotes(
    'u',
    { title: 'Mixed', notes: 'Typed part.', file: pdfFile },
    { extract: async () => 'PDF part.', generate: async (n) => { receivedNotes = n; return [goodQuestion]; }, save: fakeStore().save }
  );
  assert.equal(receivedNotes, 'Typed part.\n\nPDF part.');
});

test('PDF: wrong type, empty, too large, or unreadable files are rejected before generating', async () => {
  const store = fakeStore();
  let generated = false;
  const deps = { extract: async () => 'text', generate: async () => { generated = true; return [goodQuestion]; }, save: store.save };
  const run = (file) => createStudyPackFromNotes('u', { file }, deps);

  await assert.rejects(run({ ...pdfFile, mimeType: 'image/png' }), { status: 415 });
  await assert.rejects(run({ ...pdfFile, data: '' }), { status: 400 });
  await assert.rejects(run({ ...pdfFile, data: Buffer.alloc(16 * 1024 * 1024).toString('base64') }), { status: 413 });
  await assert.rejects(run({ name: 'x.pdf' }), { status: 400 });
  await assert.rejects(
    createStudyPackFromNotes('u', { file: pdfFile }, { ...deps, extract: async () => '   ' }),
    { status: 422 }
  );
  assert.equal(generated, false);
  assert.equal(store.saved.length, 0);
});

test('PDF: Gemini failing to read it gives a clean error', async () => {
  const deps = { generate: async () => [goodQuestion], save: fakeStore().save };
  await assert.rejects(
    createStudyPackFromNotes('u', { file: pdfFile }, { ...deps, extract: async () => { throw new Error('boom'); } }),
    { status: 502, message: /read that PDF/ }
  );
  await assert.rejects(
    createStudyPackFromNotes('u', { file: pdfFile }, { ...deps, extract: async () => { throw new Error('429'); } }),
    { status: 503 }
  );
});

test('PDF: very long documents are trimmed instead of failing', async () => {
  let receivedNotes;
  await createStudyPackFromNotes(
    'u',
    { file: pdfFile },
    { extract: async () => 'a'.repeat(MAX_NOTES_CHARS + 5000), generate: async (n) => { receivedNotes = n; return [goodQuestion]; }, save: fakeStore().save }
  );
  assert.equal(receivedNotes.length, MAX_NOTES_CHARS);
});

test('isUsableQuestion accepts the shape generateQuestions() returns', () => {
  assert.equal(isUsableQuestion(goodQuestion), true);
  assert.equal(isUsableQuestion({ ...goodQuestion, answerIndex: -1 }), false);
});

// ---- Saving notes and "Play again" (regenerate) ----

test('the notes are saved with the set so it can be regenerated later', async () => {
  const store = fakeStore();
  await createStudyPackFromNotes('auth0|amy', { notes: '  Plants use chlorophyll.  ' }, { generate: async () => [goodQuestion], save: store.save });
  assert.equal(store.saved[0].notesText, 'Plants use chlorophyll.');

  const pdfStore = fakeStore();
  await createStudyPackFromNotes(
    'auth0|amy',
    { notes: 'typed', file: { name: 'bio.pdf', mimeType: 'application/pdf', data: Buffer.from('%PDF').toString('base64') } },
    { generate: async () => [goodQuestion], extract: async () => 'from the pdf', save: pdfStore.save }
  );
  assert.equal(pdfStore.saved[0].notesText, 'typed\n\nfrom the pdf', 'PDF text is saved, so the PDF never has to be read again');
});

/** A fake saved set plus fake database functions for regenerateStudyPack. */
function fakeSavedSet({ notes = 'Plants use chlorophyll.' } = {}) {
  const set = { id: 5, title: 'Bio', questions: [{ ...goodQuestion, id: 1 }] };
  const calls = { replaced: [] };
  return {
    set,
    calls,
    deps: {
      loadSet: async (userId, id) => (userId === 'auth0|amy' && id === 5 ? set : null),
      loadNotes: async (userId, id) => (userId === 'auth0|amy' && id === 5 ? notes : null),
      replace: async (userId, id, questions) => {
        calls.replaced.push(questions);
        return { ...set, questions };
      },
    },
  };
}

test('regenerate: new questions from the saved notes replace the old ones', async () => {
  const { deps, calls } = fakeSavedSet();
  let received;
  const fresh = { ...goodQuestion, question: 'What pigment absorbs light?' };
  const result = await regenerateStudyPack('auth0|amy', 5, {
    ...deps,
    generate: async (notes, options) => {
      received = { notes, options };
      return [fresh, { ...goodQuestion, answerIndex: 9 }];
    },
  });
  assert.equal(received.notes, 'Plants use chlorophyll.');
  assert.deepEqual(received.options.avoid, [goodQuestion.question], 'Gemini is told not to repeat the old questions');
  assert.equal(calls.replaced.length, 1);
  assert.deepEqual(result.questions, [fresh], 'bad questions are dropped');
  assert.equal(result.id, 5, 'same set, same id');
});

test('regenerate: if Gemini fails, the old questions are kept', async () => {
  const { deps, calls } = fakeSavedSet();
  await assert.rejects(
    regenerateStudyPack('auth0|amy', 5, { ...deps, generate: async () => { throw new Error('boom'); } }),
    (err) => err.status === 502
  );
  await assert.rejects(
    regenerateStudyPack('auth0|amy', 5, { ...deps, generate: async () => { throw new Error('429 quota exceeded'); } }),
    (err) => err.status === 503
  );
  await assert.rejects(
    regenerateStudyPack('auth0|amy', 5, { ...deps, generate: async () => [] }),
    (err) => err.status === 502
  );
  assert.equal(calls.replaced.length, 0, 'replace was never called');
});

test("regenerate: someone else's set, or a missing one, is not found", async () => {
  const { deps, calls } = fakeSavedSet();
  const generate = async () => [goodQuestion];
  await assert.rejects(regenerateStudyPack('auth0|bob', 5, { ...deps, generate }), (err) => err.status === 404);
  await assert.rejects(regenerateStudyPack('auth0|amy', 99, { ...deps, generate }), (err) => err.status === 404);
  await assert.rejects(regenerateStudyPack('auth0|amy', NaN, { ...deps, generate }), (err) => err.status === 404);
  assert.equal(calls.replaced.length, 0);
});

test('regenerate: sets saved before notes were stored explain what to do', async () => {
  const { deps } = fakeSavedSet({ notes: null });
  await assert.rejects(
    regenerateStudyPack('auth0|amy', 5, { ...deps, generate: async () => [goodQuestion] }),
    (err) => err.status === 409 && /Upload the notes again/.test(err.message)
  );
});

test('regenerate: a double click only starts one Gemini call', async () => {
  const { deps } = fakeSavedSet();
  let calls = 0;
  let release;
  const generate = () => { calls++; return new Promise((resolve) => { release = () => resolve([goodQuestion]); }); };
  const first = regenerateStudyPack('auth0|amy', 5, { ...deps, generate });
  await new Promise((r) => setImmediate(r));
  await assert.rejects(regenerateStudyPack('auth0|amy', 5, { ...deps, generate }), (err) => err.status === 409);
  release();
  await first;
  assert.equal(calls, 1);
  // Once it finishes, it can be regenerated again.
  const again = regenerateStudyPack('auth0|amy', 5, { ...deps, generate });
  await new Promise((r) => setImmediate(r));
  release();
  await again;
  assert.equal(calls, 2);
});
