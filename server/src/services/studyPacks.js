// Glue between the Gemini code and the database:
//   notes text ─────────────────────────────┐
//   PDF → extractNotesText() (Gemini reads it) ┴→ generateQuestions() → saveQuestionSet()
//
// The Gemini functions are only CALLED from here, never modified. They're loaded
// lazily so the rest of the server (and the tests) run without the Gemini package or key.
import { saveQuestionSet } from '../db/questionSets.js';

export const MAX_NOTES_CHARS = 100_000; // ~25k words; keeps requests fast and cheap
export const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15 MB per PDF
export const SUPPORTED_FILE_TYPES = ['application/pdf'];

const defaultGenerate = async (notes) => {
  const { generateQuestions } = await import('../gemini/generateQuestions.js');
  return generateQuestions(notes);
};

const defaultExtract = async (file) => {
  const { extractNotesText } = await import('../gemini/extractNotesText.js');
  return extractNotesText(file);
};

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

/** Turn a Gemini/SDK failure into a clean error for the game. */
function geminiError(err, action) {
  console.error(`Gemini error while ${action}:`, err);
  const busy = /429|quota|rate/i.test(String(err?.message ?? err));
  return busy
    ? httpError(503, 'Gemini is busy (rate limit). Wait a moment and try again.')
    : httpError(502, `Gemini could not ${action}. Try again.`);
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

/** Check an uploaded file and return { name, mimeType, data }. */
function validateFile(file) {
  if (!file || typeof file !== 'object' || typeof file.data !== 'string') {
    throw httpError(400, 'Uploaded file is missing or unreadable.');
  }
  const name = typeof file.name === 'string' && file.name.trim() ? file.name.trim().slice(0, 200) : 'notes.pdf';
  const mimeType = String(file.mimeType || '').toLowerCase();
  if (!SUPPORTED_FILE_TYPES.includes(mimeType)) {
    throw httpError(415, 'Only PDF files can be uploaded (paste text or load a .txt/.md file for everything else).');
  }
  const bytes = Buffer.byteLength(file.data, 'base64');
  if (bytes === 0) throw httpError(400, 'The uploaded file is empty.');
  if (bytes > MAX_FILE_BYTES) throw httpError(413, 'That PDF is too large (max 15 MB).');
  return { name, mimeType, data: file.data };
}

/**
 * Generate questions from a user's notes (typed text and/or a PDF) and save them
 * as a new question set.
 * @param {string} userId
 * @param {{ title?: string, notes?: string, sourceFiles?: string[],
 *           file?: { name: string, mimeType: string, data: string } }} input  file.data = base64
 * @param {{ generate?: Function, extract?: Function, save?: Function }} [deps]  swapped for fakes in tests
 * @returns the saved set: { id, title, sourceFiles, createdAt, questions[] }
 */
export async function createStudyPackFromNotes(
  userId,
  input,
  { generate = defaultGenerate, extract = defaultExtract, save = saveQuestionSet } = {}
) {
  let notes = typeof input?.notes === 'string' ? input.notes.trim() : '';
  const sourceFiles = Array.isArray(input?.sourceFiles)
    ? input.sourceFiles.filter((f) => typeof f === 'string').slice(0, 20)
    : [];
  let title = typeof input?.title === 'string' ? input.title.trim() : '';

  if (notes.length > MAX_NOTES_CHARS) {
    throw httpError(413, `Notes are too long (max ${MAX_NOTES_CHARS.toLocaleString()} characters).`);
  }

  // PDF → text with Gemini, then treat it like any other notes.
  if (input?.file) {
    const file = validateFile(input.file);
    let text;
    try {
      text = String((await extract({ mimeType: file.mimeType, data: file.data })) ?? '').trim();
    } catch (err) {
      throw geminiError(err, 'read that PDF');
    }
    if (!text) throw httpError(422, "Couldn't find any readable text in that PDF.");
    notes = [notes, text].filter(Boolean).join('\n\n');
    if (!sourceFiles.includes(file.name)) sourceFiles.push(file.name);
    if (!title) title = file.name.replace(/\.[^.]+$/, '');
    // Long PDFs: use the first part rather than failing.
    if (notes.length > MAX_NOTES_CHARS) notes = notes.slice(0, MAX_NOTES_CHARS);
  }

  if (!notes) throw httpError(400, 'Please provide some notes or a PDF.');

  let generated;
  try {
    generated = await generate(notes);
  } catch (err) {
    throw geminiError(err, 'generate questions');
  }

  // Keep only well-formed questions, so one bad item doesn't sink the whole set.
  const questions = (Array.isArray(generated) ? generated : []).filter(isUsableQuestion);
  if (questions.length === 0) throw httpError(502, 'Gemini returned no usable questions. Try again.');

  return await save(userId, { title: title || 'Untitled notes', sourceFiles, questions });
}
