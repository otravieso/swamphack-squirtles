// Question sets + questions. Every function takes the owner's userId, so one
// student can never read or delete another student's questions.
import { getDb, transaction } from './db.js';

/**
 * Save a set of generated questions for a user. Returns the saved set.
 * This is what the Gemini code will call after generating questions.
 *
 * @param {string} userId
 * @param {{
 *   title: string,
 *   sourceFiles?: string[],
 *   questions: Array<{
 *     question: string, options: string[], answerIndex: number,
 *     explanation?: string, topic?: string, difficulty?: number, sourceQuote?: string
 *   }>
 * }} set
 */
export function saveQuestionSet(userId, { title, sourceFiles = [], questions }, db = getDb()) {
  validateQuestions(questions);

  const setId = transaction(db, () => {
    const { lastInsertRowid } = db
      .prepare('INSERT INTO question_sets (user_id, title, source_files) VALUES (?, ?, ?)')
      .run(userId, String(title).slice(0, 200), JSON.stringify(sourceFiles));

    const insert = db.prepare(
      `INSERT INTO questions
         (set_id, position, question, options, answer_index, explanation, topic, difficulty, source_quote)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    questions.forEach((q, i) => {
      insert.run(
        lastInsertRowid,
        i,
        q.question,
        JSON.stringify(q.options),
        q.answerIndex,
        q.explanation ?? null,
        q.topic ?? null,
        q.difficulty == null ? null : Math.min(Math.max(Math.round(q.difficulty), 1), 5),
        q.sourceQuote ?? null
      );
    });
    return Number(lastInsertRowid);
  });

  return getQuestionSet(userId, setId, db);
}

/** All of a user's sets, newest first (without the questions themselves). */
export function listQuestionSets(userId, db = getDb()) {
  return db
    .prepare(
      `SELECT s.id, s.title, s.source_files, s.created_at, COUNT(q.id) AS question_count
       FROM question_sets s LEFT JOIN questions q ON q.set_id = s.id
       WHERE s.user_id = ?
       GROUP BY s.id
       ORDER BY s.created_at DESC, s.id DESC`
    )
    .all(userId)
    .map((row) => ({
      id: row.id,
      title: row.title,
      sourceFiles: JSON.parse(row.source_files),
      createdAt: row.created_at,
      questionCount: row.question_count,
    }));
}

/** One set with all its questions, or null if it doesn't exist / isn't theirs. */
export function getQuestionSet(userId, setId, db = getDb()) {
  const set = db
    .prepare('SELECT id, title, source_files, created_at FROM question_sets WHERE id = ? AND user_id = ?')
    .get(setId, userId);
  if (!set) return null;

  const questions = db
    .prepare('SELECT * FROM questions WHERE set_id = ? ORDER BY position')
    .all(set.id)
    .map((q) => ({
      id: q.id,
      question: q.question,
      options: JSON.parse(q.options),
      answerIndex: q.answer_index,
      explanation: q.explanation,
      topic: q.topic,
      difficulty: q.difficulty,
      sourceQuote: q.source_quote,
    }));

  return {
    id: set.id,
    title: set.title,
    sourceFiles: JSON.parse(set.source_files),
    createdAt: set.created_at,
    questions,
  };
}

/** Delete a set (its questions go with it). Returns true if something was deleted. */
export function deleteQuestionSet(userId, setId, db = getDb()) {
  const { changes } = db.prepare('DELETE FROM question_sets WHERE id = ? AND user_id = ?').run(setId, userId);
  return changes > 0;
}

function validateQuestions(questions) {
  const fail = (msg) => {
    const err = new Error(msg);
    err.status = 400;
    throw err;
  };
  if (!Array.isArray(questions) || questions.length === 0) fail('questions must be a non-empty array');
  if (questions.length > 200) fail('too many questions (max 200)');
  questions.forEach((q, i) => {
    if (!q || typeof q.question !== 'string' || !q.question.trim()) fail(`questions[${i}].question is required`);
    if (!Array.isArray(q.options) || q.options.length < 2) fail(`questions[${i}].options needs 2+ choices`);
    if (!Number.isInteger(q.answerIndex) || q.answerIndex < 0 || q.answerIndex >= q.options.length) {
      fail(`questions[${i}].answerIndex must point at one of the options`);
    }
  });
}
