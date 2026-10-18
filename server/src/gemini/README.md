# server/src/gemini/

Gemini API code (key from Google AI Studio, stored in `.env` as `GEMINI_API_KEY`).

- `generateQuestions.js`: `generateQuestions(notesText, { avoid? })` → one round of 10 questions
  `{ type, question, options, answerIndex, explanation, topic, difficulty, sourceQuote }`
  using Gemini's structured JSON output. `avoid` = earlier questions not to repeat ("Play again").
- `questionMix.js`: the fixed mix per round, **5 multiple choice, 2 true/false, 3 fill-in-the-blank**,
  in a random order each time. Change the numbers there to make rounds longer.
  Every type uses the same `options` + `answerIndex` format, so the game shows them all as buttons:
  - multiple choice: 4 options (shuffled)
  - true/false: options are always `["True", "False"]`
  - fill-in-the-blank: a sentence from the notes with a key term replaced by `_____`, plus 4 options
    (the term and 3 look-/sound-alikes or other terms from the notes)
- `extractNotesText.js`: `extractNotesText({ mimeType, data })` → plain text from a PDF
  (Gemini reads it directly; works for scanned/handwritten pages). Only used when our own reader,
  `server/src/pdf/readPdfText.js`, finds too little text in the PDF. Its output is fed to `generateQuestions()`.
- Try it on its own: `node server/test-gemini.js`

It's called by `server/src/services/studyPacks.js`, which saves the result to the database
(see `POST /api/notes`). Supported input: typed text, .txt/.md files (read in the browser) and PDFs.
