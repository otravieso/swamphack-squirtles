// Glue between the Gemini code and the database:
//   notes text → generateQuestions() (server/src/gemini/) → saveQuestionSet() (server/src/db/)
//
// The Gemini function is only CALLED from here, never modified. It's loaded
// lazily so the rest of the server (and the tests) run even without the
// Gemini package or key.
import { saveQuestionSet } from '../db/questionSets.js';

export const MAX_NOTES_CHARS = 100_000; // ~25k words; keeps requests fast and cheap

const defaultGenerate = async (notes) => {
  const { generateQuestions } = await import('../gemini/generateQuestions.js');
  return generateQuestions(notes);
};

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

/** True if a question from Gemini has everything the game needs. */
export function isUsableQuestion(q) {
  return (
    q &&
    typeof q.question === 'string' &&
    q.question.trim() !== '' &&
    Array.isArray(q.options) &&
    q.options.length >= 2 &&
    q.options.every((o) => typeof o === 'string' && o.trim() !== '') &&
    Number.isInteger(q.answerIndex) &&
    q.answerIndex >= 0 &&
    q.answerIndex < q.options.length
  );
}

/**
 * Generate questions from a user's notes and save them as a new question set.
 * @param {string} userId
 * @param {{ title?: string, notes: string, sourceFiles?: string[] }} input
 * @param {{ generate?: (notes: string) => Promise<object[]> }} [deps]  for tests
 * @returns the saved set: { id, title, sourceFiles, createdAt, questions[] }
 */
export async function createStudyPackFromNotes(userId, input, { generate = defaultGenerate, db } = {}) {
  const notes = typeof input?.notes === 'string' ? input.notes.trim() : '';
  const title = (typeof input?.title === 'string' && input.title.trim()) || 'Untitled notes';
  const sourceFiles = Array.isArray(input?.sourceFiles)
    ? input.sourceFiles.filter((f) => typeof f === 'string').slice(0, 20)
    : [];

  if (!notes) throw httpError(400, 'Please provide some notes.');
  if (notes.length > MAX_NOTES_CHARS) {
    throw httpError(413, `Notes are too long (max ${MAX_NOTES_CHARS.toLocaleString()} characters).`);
  }

  let generated;
  try {
    generated = await generate(notes);
  } catch (err) {
    console.error('Gemini error:', err);
    const busy = /429|quota|rate/i.test(String(err?.message ?? err));
    throw httpError(busy ? 503 : 502, busy
      ? 'Gemini is busy (rate limit). Wait a moment and try again.'
      : 'Gemini could not generate questions. Try again.');
  }

  // Keep only well-formed questions, so one bad item doesn't sink the whole set.
  const questions = (Array.isArray(generated) ? generated : []).filter(isUsableQuestion);
  if (questions.length === 0) throw httpError(502, 'Gemini returned no usable questions. Try again.');

  return saveQuestionSet(userId, { title, sourceFiles, questions }, db);
}
