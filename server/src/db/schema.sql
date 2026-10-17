
-- Users are authenticated through Auth0.
-- PostgreSQL stores their profile, not their password.
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Each study pack belongs to one user.
CREATE TABLE IF NOT EXISTS question_sets (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    source_files JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- The notes (typed text + text read from PDFs) the questions came from,
    -- so "Play again" can generate fresh questions without re-uploading.
    notes_text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Adds notes_text to databases created before it existed (safe to run again).
ALTER TABLE question_sets ADD COLUMN IF NOT EXISTS notes_text TEXT;

-- Gemini-generated questions belong to a study pack.
CREATE TABLE IF NOT EXISTS questions (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    set_id INTEGER NOT NULL REFERENCES question_sets(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    question TEXT NOT NULL,
    options JSONB NOT NULL,
    answer_index INTEGER NOT NULL,
    explanation TEXT,
    topic TEXT,
    difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 5),
    source_quote TEXT
);

-- Speed up retrieving a user's saved study packs.
CREATE INDEX IF NOT EXISTS idx_sets_user
ON question_sets(user_id);

-- Speed up loading questions in their original order.
CREATE INDEX IF NOT EXISTS idx_questions_set
ON questions(set_id, position);
