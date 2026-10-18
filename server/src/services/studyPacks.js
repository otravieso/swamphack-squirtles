// Glue between the Gemini code and the database:
//   notes text ─────────────────────────────────────────────────┐
//   PDF → readPdfText() on our server (free)                      ├→ generateQuestions() → saveQuestionSet()
//         └ scanned/no text? → extractNotesText() (Gemini reads it) ┘
//
// "Play again" (regenerateStudyPack): saved notes → generateQuestions() → replaceQuestions()
//
// The Gemini functions are only CALLED from here, never modified. They're loaded
// lazily so the rest of the server (and the tests) run without the Gemini package or key.
import { saveQuestionSet, getQuestionSet, getNotesText, replaceQuestions } from '../db/questionSets.js';
import { looksScanned } from '../pdf/readPdfText.js';

export const MAX_NOTES_CHARS = 100_000; // ~25k words; keeps requests fast and cheap
export const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15 MB per PDF
export const SUPPORTED_FILE_TYPES = ['application/pdf'];

const defaultGenerate = async (notes, options) => {
  const { generateQuestions } = await import('../gemini/generateQuestions.js');
  return generateQuestions(notes, options);
};

const defaultReadPdf = async (base64) => {
  const { readPdfText } = await import('../pdf/readPdfText.js');
  return readPdfText(base64);
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

/** "84670" seconds → "about 24 hours", etc. */
function formatWait(seconds) {
  if (seconds < 90) return `${Math.max(1, Math.ceil(seconds))} seconds`;
  if (seconds < 90 * 60) return `${Math.round(seconds / 60)} minutes`;
  return `about ${Math.round(seconds / 3600)} hours`;
}

/** The player-facing message for a Gemini usage-limit error (HTTP 429). */
export function quotaMessage(raw) {
  const delay = raw.match(/retryDelay\W+(\d+(?:\.\d+)?)s/i);
  const seconds = delay ? Number(delay[1]) : null;
  if (/PerDay/i.test(raw)) {
    const when = seconds ? ` It resets in ${formatWait(seconds)}.` : ' It resets tomorrow.';
    return `Gemini's free daily limit for this project is used up.${when} ` +
      'To keep going now, use a GEMINI_API_KEY from a different Google project or turn on billing in Google AI Studio.';
  }
  return seconds
    ? `Too many Gemini requests right now. Try again in ${formatWait(seconds)}.`
    : 'Too many Gemini requests right now. Wait a minute and try again.';
}

/** Turn a Gemini/SDK failure into a clean error for the game. */
function geminiError(err, action) {
  const raw = String(err?.message ?? err);
  if (/\b429\b|RESOURCE_EXHAUSTED|quota|rate.?limit/i.test(raw)) {
    const message = quotaMessage(raw);
    console.error(`Gemini usage limit while trying to ${action}: ${message}`);
    return httpError(429, message);
  }
  console.error(`Gemini error while trying to ${action}:`, err);
  // Include Gemini's own reason (trimmed) so problems can be diagnosed from the game/test page.
  const reason = raw.replace(/\s+/g, ' ').slice(0, 300);
  return httpError(502, `Gemini could not ${action}. Reason: ${reason}`);
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
  { generate = defaultGenerate, extract = defaultExtract, readPdf = defaultReadPdf, save = saveQuestionSet } = {}
) {
  let notes = typeof input?.notes === 'string' ? input.notes.trim() : '';
  const sourceFiles = Array.isArray(input?.sourceFiles)
    ? input.sourceFiles.filter((f) => typeof f === 'string').slice(0, 20)
    : [];
  let title = typeof input?.title === 'string' ? input.title.trim() : '';

  if (notes.length > MAX_NOTES_CHARS) {
    throw httpError(413, `Notes are too long (max ${MAX_NOTES_CHARS.toLocaleString()} characters).`);
  }

  // PDF → text, then treat it like any other notes. Read it on our server first (free);
  // only scanned/image PDFs, or a failure, use a Gemini request.
  if (input?.file) {
    const file = validateFile(input.file);
    let text = '';
    let local = null;
    try {
      local = await readPdf(file.data);
    } catch (err) {
      console.warn(`Couldn't read "${file.name}" on the server (${err.message}); asking Gemini instead.`);
    }
    if (local && !looksScanned(local)) {
      text = local.text.trim();
      console.log(`Read "${file.name}" on the server (${local.pages} pages), no Gemini request needed.`);
    } else {
      try {
        text = String((await extract({ mimeType: file.mimeType, data: file.data })) ?? '').trim();
      } catch (err) {
        throw geminiError(err, 'read that PDF');
      }
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

  // The notes are saved too, so "Play again" can generate new questions from them.
  return await save(userId, { title: title || 'Untitled notes', sourceFiles, questions, notesText: notes });
}

// Sets being regenerated right now ("userId:setId"), so a double click can't
// start two Gemini calls for the same set.
const regenerating = new Set();

/**
 * "Play again": generate a fresh round of questions from a set's saved notes and
 * replace the old questions. If anything fails, the old questions stay.
 * @param {string} userId
 * @param {number} setId
 * @param {{ generate?: Function, loadSet?: Function, loadNotes?: Function, replace?: Function }} [deps]  fakes in tests
 * @returns the updated set: { id, title, sourceFiles, createdAt, hasNotes, questions[] }
 */
export async function regenerateStudyPack(
  userId,
  setId,
  { generate = defaultGenerate, loadSet = getQuestionSet, loadNotes = getNotesText, replace = replaceQuestions } = {}
) {
  if (!Number.isInteger(setId) || setId <= 0) throw httpError(404, 'Question set not found');

  const key = `${userId}:${setId}`;
  if (regenerating.has(key)) throw httpError(409, 'New questions for this set are already being generated.');
  regenerating.add(key);

  try {
    const set = await loadSet(userId, setId);
    if (!set) throw httpError(404, 'Question set not found');

    const notes = await loadNotes(userId, setId);
    if (!notes) {
      throw httpError(409, 'This set was saved before notes were stored, so it can\'t make new questions. Upload the notes again to get a set that can.');
    }

    // Tell Gemini what was already asked so the new round covers different facts.
    const avoid = (set.questions ?? []).map((q) => q.question);

    let generated;
    try {
      generated = await generate(notes, { avoid });
    } catch (err) {
      throw geminiError(err, 'generate new questions');
    }

    const questions = (Array.isArray(generated) ? generated : []).filter(isUsableQuestion);
    if (questions.length === 0) throw httpError(502, 'Gemini returned no usable questions. Try again.');

    const updated = await replace(userId, setId, questions);
    if (!updated) throw httpError(404, 'Question set not found');
    return updated;
  } finally {
    regenerating.delete(key);
  }
}
