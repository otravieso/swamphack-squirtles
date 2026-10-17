// Turns uploaded notes into a "study pack": topics + ~20 quiz questions.
import { generateJson } from './client.js';
import { studyPackSchema } from './schemas.js';
import { config } from '../config.js';

// File types Gemini can read directly. (.docx is NOT supported, so export to PDF.)
const GEMINI_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/heic',
]);
const TEXT_EXTENSIONS = /\.(txt|md|markdown|csv)$/i;

const SYSTEM = `You are the curriculum engine for a study game.
Read the student's notes carefully (they may be typed, scanned or handwritten).
Only ask about material that actually appears in the notes. Never invent facts.
Write clear multiple-choice questions with 4 plausible options and one correct answer.
Mix difficulties and cover every topic. Prefer understanding over trivia.`;

/** Convert multer files into Gemini content parts. */
export function filesToParts(files) {
  const parts = [];
  for (const f of files) {
    if (TEXT_EXTENSIONS.test(f.originalname) || f.mimetype.startsWith('text/')) {
      parts.push({ text: `--- Notes file: ${f.originalname} ---\n${f.buffer.toString('utf8')}` });
    } else if (GEMINI_MIME_TYPES.has(f.mimetype)) {
      parts.push({ inlineData: { mimeType: f.mimetype, data: f.buffer.toString('base64') } });
    } else {
      const err = new Error(
        `Unsupported file "${f.originalname}". Upload PDF, images, or .txt/.md (export Word docs to PDF).`
      );
      err.status = 400;
      throw err;
    }
  }
  return parts;
}

export async function generateStudyPack(files, count = config.questionCount) {
  const parts = [
    ...filesToParts(files),
    { text: `Create a study pack from these notes with exactly ${count} questions.` },
  ];
  const pack = await generateJson({ parts, schema: studyPackSchema, systemInstruction: SYSTEM });

  // Light cleanup so the game can trust the data.
  pack.questions = pack.questions
    .filter((q) => Array.isArray(q.options) && q.options.length >= 2)
    .map((q, i) => ({
      id: i,
      ...q,
      answerIndex: Math.min(Math.max(q.answerIndex, 0), q.options.length - 1),
      difficulty: Math.min(Math.max(q.difficulty ?? 3, 1), 5),
    }));
  return pack;
}
