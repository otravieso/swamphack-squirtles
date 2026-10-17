# server/src/gemini/

Gemini API code (key from Google AI Studio, stored in `.env` as `GEMINI_API_KEY`).

- `generateQuestions.js`: `generateQuestions(notesText)` → 10 multiple-choice questions
  `{ question, options[4], answerIndex, explanation, topic, difficulty, sourceQuote }`
  using Gemini's structured JSON output.
- Try it on its own: `node server/test-gemini.js`

It's called by `server/src/services/studyPacks.js`, which saves the result to the database
(see `POST /api/notes`). Notes are plain text for now; PDFs/images would be a later change here.
