# server/src/gemini/

Gemini API code (key from Google AI Studio, stored in `.env` as `GEMINI_API_KEY`).

- `generateQuestions.js`: `generateQuestions(notesText)` → 10 multiple-choice questions
  `{ question, options[4], answerIndex, explanation, topic, difficulty, sourceQuote }`
  using Gemini's structured JSON output.
- `extractNotesText.js`: `extractNotesText({ mimeType, data })` → plain text from a PDF
  (Gemini reads it directly; works for scanned/handwritten pages). Its output is fed to `generateQuestions()`.
- Try it on its own: `node server/test-gemini.js`

It's called by `server/src/services/studyPacks.js`, which saves the result to the database
(see `POST /api/notes`). Supported input: typed text, .txt/.md files (read in the browser) and PDFs.
