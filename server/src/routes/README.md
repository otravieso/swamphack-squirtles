# server/src/routes/

API endpoints. All except `/api/health` require login.

| Method | Path | What it does |
|---|---|---|
| GET | `/api/health` | Server is up; which services are configured |
| GET | `/api/me` | The logged-in user's database record |
| GET | `/api/question-sets` | List the user's saved question sets |
| POST | `/api/question-sets` | Save a set `{ title, sourceFiles?, questions[] }` |
| GET | `/api/question-sets/:id` | One set with its questions |
| DELETE | `/api/question-sets/:id` | Delete a set |
| POST | `/api/notes` | `{ title?, notes?, sourceFiles?, file? }` → Gemini generates questions → saved for this user → returns the set. `file` = `{ name, mimeType: 'application/pdf', data: base64 }` (max 15 MB) |

`/api/notes` logic lives in `server/src/services/studyPacks.js` (PDFs: `extractNotesText()` turns them into text; then `generateQuestions()` from `server/src/gemini/`, then `saveQuestionSet()`).
