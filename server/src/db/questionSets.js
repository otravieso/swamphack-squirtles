
import { getDb } from './db.js';

// Save a set of generated questions for a user.
export async function saveQuestionSet(
  userId,
  { title, sourceFiles = [], questions },
  db = getDb()
) {
  validateQuestions(questions);

  // Use one connection so all inserts happen in one transaction.
  const client = await db.connect();

  let setId;

  try {
    await client.query('BEGIN');

    const setResult = await client.query(
      `INSERT INTO question_sets (user_id, title, source_files)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [userId, String(title).slice(0, 200), JSON.stringify(sourceFiles)]
    );

    setId = setResult.rows[0].id;

    for (const [i, q] of questions.entries()) {
      await client.query(
        `INSERT INTO questions
         (set_id, position, question, options, answer_index,
          explanation, topic, difficulty, source_quote)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          setId,
          i,
          q.question,
          JSON.stringify(q.options),
          q.answerIndex,
          q.explanation ?? null,
          q.topic ?? null,
          q.difficulty == null
            ? null
            : Math.min(Math.max(Math.round(q.difficulty), 1), 5),
          q.sourceQuote ?? null,
        ]
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  return getQuestionSet(userId, setId, db);
}

// List all of a user's saved sets, newest first.
export async function listQuestionSets(userId, db = getDb()) {
  const result = await db.query(
    `SELECT s.id, s.title, s.source_files, s.created_at,
            COUNT(q.id)::integer AS question_count
     FROM question_sets s
     LEFT JOIN questions q ON q.set_id = s.id
     WHERE s.user_id = $1
     GROUP BY s.id
     ORDER BY s.created_at DESC, s.id DESC`,
    [userId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    title: row.title,
    sourceFiles: row.source_files,
    createdAt: row.created_at,
    questionCount: row.question_count,
  }));
}

// Get one saved set and all its questions.
export async function getQuestionSet(userId, setId, db = getDb()) {
  const setResult = await db.query(
    `SELECT id, title, source_files, created_at
     FROM question_sets
     WHERE id = $1 AND user_id = $2`,
    [setId, userId]
  );

  const set = setResult.rows[0];
  if (!set) return null;

  const questionResult = await db.query(
    `SELECT * FROM questions
     WHERE set_id = $1
     ORDER BY position`,
    [set.id]
  );

  const questions = questionResult.rows.map((q) => ({
    id: q.id,
    question: q.question,
    options: q.options,
    answerIndex: q.answer_index,
    explanation: q.explanation,
    topic: q.topic,
    difficulty: q.difficulty,
    sourceQuote: q.source_quote,
  }));

  return {
    id: set.id,
    title: set.title,
    sourceFiles: set.source_files,
    createdAt: set.created_at,
    questions,
  };
}

// Delete a set belonging to the user.
// PostgreSQL automatically deletes its questions.
export async function deleteQuestionSet(userId, setId, db = getDb()) {
  const result = await db.query(
    `DELETE FROM question_sets
     WHERE id = $1 AND user_id = $2`,
    [setId, userId]
  );

  return result.rowCount > 0;
}

// Validate Gemini-generated questions before saving.
function validateQuestions(questions) {
  const fail = (msg) => {
    const err = new Error(msg);
    err.status = 400;
    throw err;
  };

  if (!Array.isArray(questions) || questions.length === 0) {
    fail('questions must be a non-empty array');
  }

  if (questions.length > 200) {
    fail('too many questions (max 200)');
  }

  questions.forEach((q, i) => {
    if (!q || typeof q.question !== 'string' || !q.question.trim()) {
      fail(`questions[${i}].question is required`);
    }

    if (!Array.isArray(q.options) || q.options.length < 2) {
      fail(`questions[${i}].options needs 2+ choices`);
    }

    if (
      !Number.isInteger(q.answerIndex) ||
      q.answerIndex < 0 ||
      q.answerIndex >= q.options.length
    ) {
      fail(`questions[${i}].answerIndex must point at one of the options`);
    }
  });
}
