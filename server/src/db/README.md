
# server/src/db/: Database

We use **Tiger Data (hosted PostgreSQL)** to store user information,
saved study packs, and Gemini-generated questions.

All teammates connect to the same hosted database using DATABASE_URL.

## Authentication

Auth0 handles registration, login, passwords, and token verification.

PostgreSQL stores each user's Auth0 ID and associated study data.
We never store user passwords in PostgreSQL.

## Tables

```text
users              id (Auth0 user ID) · username · created_at · last_login
  └─ question_sets   id · user_id · title · source_files · notes_text · created_at
       └─ questions  id · set_id · position · question · options (JSONB)
                     answer_index · explanation · topic
                     difficulty (1-5) · source_quote
```

`notes_text` keeps the notes (typed + text read from PDFs) a set was made from,
so "Play again" can generate new questions. It's null for sets made before it existed.

Deleting a user deletes their question sets.
Deleting a question set deletes its questions.

## Using it from server code

```js
import {
  saveQuestionSet,
  listQuestionSets,
  getQuestionSet,
  deleteQuestionSet,
  replaceQuestions,   // swap a set's questions (one transaction)
  getNotesText        // the notes a set was made from, or null
} from '../db/questionSets.js';

// After Gemini generates questions:
const saved = await saveQuestionSet(req.user.id, {
  title: 'Bio Ch. 3',
  sourceFiles: ['bio.pdf'],
  questions
});
```

The question shape is:

```js
{
  question,
  options,
  answerIndex,
  explanation,
  topic,
  difficulty,
  sourceQuote
}
```

All database functions are asynchronous and must be awaited.

Every function uses the authenticated user's ID to prevent
students from accessing each other's study packs.

## Database Files

- db.js: PostgreSQL connection pool
- schema.sql: Database table definitions
- users.js: User database operations
- questionSets.js: Study pack and question operations

## Configuration

Set DATABASE_URL in the root .env file.

Never commit database credentials or the .env file to GitHub.

Use verified TLS certificates for production connections.

## Creating the Tables

From the project root:

```bash
node server/setup-db.js          # real tables
node server/setup-db.js --test   # the "test" schema used by npm test
```

Safe to run again: it only adds what's missing (e.g. the `notes_text` column).

## Starting the Backend

```bash
npm run dev -w server
```

The server checks its PostgreSQL connection before starting.

## Tests

Database tests need to be updated from SQLite to PostgreSQL.
Do not run database tests against the shared Tiger Data database
if they create or delete test records.
```
