# server/src/db/: database

SQLite using Node's built-in `node:sqlite` (needs **Node 22.13+**, nothing to install).
The database is one file, `server/data/squirtles.db`, created automatically on first run
and gitignored. Each teammate has their own local copy.

## Tables

```
users            id (Auth0 user id) · username · created_at · last_login
  └─ question_sets   id · user_id · title · source_files · created_at
       └─ questions      id · set_id · position · question · options (JSON) · answer_index
                         explanation · topic · difficulty (1-5) · source_quote
```

Deleting a user deletes their sets; deleting a set deletes its questions.

## Using it from server code

```js
import { saveQuestionSet, listQuestionSets, getQuestionSet, deleteQuestionSet } from '../db/questionSets.js';

// e.g. right after Gemini generates questions:
const saved = saveQuestionSet(req.user.id, { title: 'Bio Ch. 3', sourceFiles: ['bio.pdf'], questions });
```

The question shape matches what the Gemini code should produce:
`{ question, options[], answerIndex, explanation?, topic?, difficulty?, sourceQuote? }`.

Every function takes the user's id, so a student can only ever see their own questions.

## Tests
`npm test` (from the root folder) runs `server/test/db.test.js` against an in-memory database.

## Moving to a hosted database later
Only the files in this folder contain SQL. To move to e.g. Vultr Managed PostgreSQL,
rewrite these functions with the same names and nothing else changes.
To inspect the local file, open it with the VS Code "SQLite Viewer" extension.
