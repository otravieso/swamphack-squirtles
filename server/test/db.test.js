
import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";

import {
  testDb,
  verifyTestDatabase,
  closeTestDatabase,
} from "./testDb.js";

import { upsertUser, getUser } from "../src/db/users.js";

import {
  saveQuestionSet,
  listQuestionSets,
  getQuestionSet,
  deleteQuestionSet,
} from "../src/db/questionSets.js";

// Sample questions used throughout the tests.
const sampleQuestions = [
  {
    question: "Powerhouse of the cell?",
    options: ["Nucleus", "Mitochondria", "Ribosome", "Golgi"],
    answerIndex: 1,
    explanation: "Mitochondria make ATP.",
    topic: "Organelles",
    difficulty: 1,
    sourceQuote: "Mitochondria produce ATP",
  },
  {
    question: "Water across a membrane?",
    options: ["Diffusion", "Osmosis"],
    answerIndex: 1,
  },
];

// Check that we're connected to the test schema.
before(async () => {
  await verifyTestDatabase();
});

// Reset test data before each test.
beforeEach(async () => {
  // Confirm the connection is still using the test schema.
  await verifyTestDatabase();

  // Only clear tables inside the test schema.
  await testDb.query(`
    TRUNCATE TABLE
      test.questions,
      test.question_sets,
      test.users
    RESTART IDENTITY CASCADE
  `);

  // Create test users.
  await upsertUser(
    { id: "auth0|alice", username: "alice" },
    testDb
  );

  await upsertUser(
    { id: "auth0|bob", username: "bob" },
    testDb
  );
});

// Close the connection when testing finishes.
after(async () => {
  await closeTestDatabase();
});

// Test 1: User creation and updates.
test("upsertUser creates and updates users", async () => {
  const updated = await upsertUser(
    { id: "auth0|alice", username: "alice2" },
    testDb
  );

  assert.equal(updated.username, "alice2");

  const user = await getUser("auth0|alice", testDb);
  assert.equal(user.username, "alice2");

  const missing = await getUser("nobody", testDb);
  assert.equal(missing, null);
});

// Test 2: Save and retrieve question sets.
test("save, list, and get questions in order", async () => {
  const saved = await saveQuestionSet(
    "auth0|alice",
    {
      title: "Bio",
      sourceFiles: ["bio.pdf"],
      questions: sampleQuestions,
    },
    testDb
  );

  assert.equal(saved.questions.length, 2);
  assert.deepEqual(
    saved.questions[0].options,
    sampleQuestions[0].options
  );
  assert.equal(saved.questions[1].answerIndex, 1);
  assert.equal(saved.questions[1].difficulty, null);

  const list = await listQuestionSets("auth0|alice", testDb);

  assert.equal(list.length, 1);
  assert.equal(list[0].questionCount, 2);
  assert.deepEqual(list[0].sourceFiles, ["bio.pdf"]);

  const retrieved = await getQuestionSet(
    "auth0|alice",
    saved.id,
    testDb
  );

  assert.equal(retrieved.questions.length, 2);
});

// Test 3: Users cannot access each other's data.
test("users cannot see or delete each other's sets", async () => {
  const saved = await saveQuestionSet(
    "auth0|alice",
    {
      title: "Bio",
      questions: sampleQuestions,
    },
    testDb
  );

  assert.equal(
    await getQuestionSet("auth0|bob", saved.id, testDb),
    null
  );

  const bobSets = await listQuestionSets("auth0|bob", testDb);
  assert.equal(bobSets.length, 0);

  assert.equal(
    await deleteQuestionSet("auth0|bob", saved.id, testDb),
    false
  );

  assert.ok(
    await getQuestionSet("auth0|alice", saved.id, testDb)
  );
});

// Test 4: Deleting a set deletes its questions.
test("delete removes the set and its questions", async () => {
  const saved = await saveQuestionSet(
    "auth0|alice",
    {
      title: "Bio",
      questions: sampleQuestions,
    },
    testDb
  );

  const deleted = await deleteQuestionSet(
    "auth0|alice",
    saved.id,
    testDb
  );

  assert.equal(deleted, true);

  const result = await testDb.query(
    "SELECT COUNT(*) AS n FROM test.questions"
  );

  assert.equal(Number(result.rows[0].n), 0);
});

// Test 5: Invalid questions should not be saved.
test("invalid questions are rejected", async () => {
  const badQuestions = [
    ...sampleQuestions,
    {
      question: "Broken",
      options: ["A", "B"],
      answerIndex: 5,
    },
  ];

  await assert.rejects(
    () =>
      saveQuestionSet(
        "auth0|alice",
        {
          title: "Bad",
          questions: badQuestions,
        },
        testDb
      ),
    /answerIndex/
  );

  await assert.rejects(
    () =>
      saveQuestionSet(
        "auth0|alice",
        {
          title: "Empty",
          questions: [],
        },
        testDb
      ),
    /non-empty/
  );

  const sets = await listQuestionSets("auth0|alice", testDb);
  assert.equal(sets.length, 0);
});

// Test 6: Question sets require an existing user.
test("cannot save a set for a nonexistent user", async () => {
  await assert.rejects(
    () =>
      saveQuestionSet(
        "auth0|ghost",
        {
          title: "X",
          questions: sampleQuestions,
        },
        testDb
      ),
    /foreign key/i
  );

  const result = await testDb.query(
    "SELECT COUNT(*) AS n FROM test.questions"
  );

  assert.equal(Number(result.rows[0].n), 0);
});
