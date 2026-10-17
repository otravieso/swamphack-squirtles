// Database tests. Run with: npm test -w server
// Uses an in-memory database, so it never touches the real data file.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { openDatabase, migrate } from '../src/db/db.js';
import { upsertUser, getUser } from '../src/db/users.js';
import {
  saveQuestionSet,
  listQuestionSets,
  getQuestionSet,
  deleteQuestionSet,
} from '../src/db/questionSets.js';

const sampleQuestions = [
  {
    question: 'Powerhouse of the cell?',
    options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Golgi'],
    answerIndex: 1,
    explanation: 'Mitochondria make ATP.',
    topic: 'Organelles',
    difficulty: 1,
    sourceQuote: 'Mitochondria produce ATP',
  },
  { question: 'Water across a membrane?', options: ['Diffusion', 'Osmosis'], answerIndex: 1 },
];

function freshDb() {
  const db = openDatabase(':memory:');
  upsertUser({ id: 'auth0|alice', username: 'alice' }, db);
  upsertUser({ id: 'auth0|bob', username: 'bob' }, db);
  return db;
}

test('upsertUser creates, updates, and keeps username if a login has none', () => {
  const db = freshDb();
  assert.equal(upsertUser({ id: 'auth0|alice', username: 'alice2' }, db).username, 'alice2');
  assert.equal(upsertUser({ id: 'auth0|alice' }, db).username, 'alice2'); // kept
  assert.equal('email' in getUser('auth0|alice', db), false);
  assert.equal(getUser('nobody', db), null);
});

test('old database files with an email column are upgraded', () => {
  const old = new DatabaseSync(':memory:');
  old.exec(`CREATE TABLE users (id TEXT PRIMARY KEY, username TEXT, email TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')), last_login TEXT NOT NULL DEFAULT (datetime('now')))`);
  old.exec(`INSERT INTO users (id, username, email) VALUES ('auth0|old', 'olduser', 'x@y.com')`);
  migrate(old);
  const cols = old.prepare('PRAGMA table_info(users)').all().map((c) => c.name);
  assert.equal(cols.includes('email'), false);
  assert.equal(getUser('auth0|old', old).username, 'olduser');
});

test('save → list → get round-trips questions in order', () => {
  const db = freshDb();
  const saved = saveQuestionSet('auth0|alice', { title: 'Bio', sourceFiles: ['bio.pdf'], questions: sampleQuestions }, db);
  assert.equal(saved.questions.length, 2);
  assert.deepEqual(saved.questions[0].options, sampleQuestions[0].options);
  assert.equal(saved.questions[1].answerIndex, 1);
  assert.equal(saved.questions[1].difficulty, null);

  const list = listQuestionSets('auth0|alice', db);
  assert.equal(list.length, 1);
  assert.equal(list[0].questionCount, 2);
  assert.deepEqual(list[0].sourceFiles, ['bio.pdf']);
});

test('users cannot see or delete each other\'s sets', () => {
  const db = freshDb();
  const saved = saveQuestionSet('auth0|alice', { title: 'Bio', questions: sampleQuestions }, db);
  assert.equal(getQuestionSet('auth0|bob', saved.id, db), null);
  assert.equal(listQuestionSets('auth0|bob', db).length, 0);
  assert.equal(deleteQuestionSet('auth0|bob', saved.id, db), false);
  assert.ok(getQuestionSet('auth0|alice', saved.id, db));
});

test('delete removes the set and its questions', () => {
  const db = freshDb();
  const saved = saveQuestionSet('auth0|alice', { title: 'Bio', questions: sampleQuestions }, db);
  assert.equal(deleteQuestionSet('auth0|alice', saved.id, db), true);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM questions').get().n, 0);
});

test('invalid questions are rejected and nothing is half-saved', () => {
  const db = freshDb();
  const bad = [...sampleQuestions, { question: 'Broken', options: ['A', 'B'], answerIndex: 5 }];
  assert.throws(() => saveQuestionSet('auth0|alice', { title: 'Bad', questions: bad }, db), /answerIndex/);
  assert.throws(() => saveQuestionSet('auth0|alice', { title: 'Empty', questions: [] }, db), /non-empty/);
  assert.equal(listQuestionSets('auth0|alice', db).length, 0);
});

test('a set cannot be saved for a user that does not exist', () => {
  const db = freshDb();
  assert.throws(() => saveQuestionSet('auth0|ghost', { title: 'X', questions: sampleQuestions }, db), /FOREIGN KEY/);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM questions').get().n, 0);
});
