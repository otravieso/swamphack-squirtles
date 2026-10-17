
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
  replaceQuestions,
  getNotesText,
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

// Test 7: Notes are saved with a set (for "Play again").
test("notes are saved and only the owner can read them", async () => {
  const withNotes = await saveQuestionSet(
    "auth0|alice",
    { title: "Bio", questions: sampleQuestions, notesText: "Mitochondria make ATP." },
    testDb
  );
  const withoutNotes = await saveQuestionSet(
    "auth0|alice",
    { title: "Old", questions: sampleQuestions },
    testDb
  );

  assert.equal(await getNotesText("auth0|alice", withNotes.id, testDb), "Mitochondria make ATP.");
  assert.equal(await getNotesText("auth0|bob", withNotes.id, testDb), null);
  assert.equal(await getNotesText("auth0|alice", withoutNotes.id, testDb), null);

  assert.equal(withNotes.hasNotes, true);
  assert.equal(withoutNotes.hasNotes, false);

  const list = await listQuestionSets("auth0|alice", testDb);
  assert.deepEqual(list.map((s) => s.hasNotes).sort(), [false, true]);
});

// Test 8: Replacing questions keeps the set and swaps its questions.
test("replaceQuestions swaps a set's questions in one step", async () => {
  const saved = await saveQuestionSet(
    "auth0|alice",
    { title: "Bio", questions: sampleQuestions, notesText: "notes" },
    testDb
  );

  const fresh = [
    { question: "Fill in the blank: ATP is made in the _____.", options: ["mitochondria", "nucleus", "ribosome", "golgi"], answerIndex: 0 },
    { question: "Osmosis moves water.", options: ["True", "False"], answerIndex: 0 },
    { question: "Which organelle makes proteins?", options: ["Ribosome", "Nucleus", "Vacuole", "Golgi"], answerIndex: 0 },
  ];

  const updated = await replaceQuestions("auth0|alice", saved.id, fresh, testDb);

  assert.equal(updated.id, saved.id);
  assert.equal(updated.title, "Bio");
  assert.deepEqual(updated.questions.map((q) => q.question), fresh.map((q) => q.question));

  const result = await testDb.query("SELECT COUNT(*) AS n FROM test.questions");
  assert.equal(Number(result.rows[0].n), 3, "old questions are gone");
  assert.equal(await getNotesText("auth0|alice", saved.id, testDb), "notes", "notes are kept");
});

// Test 9: Replacing fails safely.
test("replaceQuestions keeps old questions on bad input or the wrong user", async () => {
  const saved = await saveQuestionSet(
    "auth0|alice",
    { title: "Bio", questions: sampleQuestions },
    testDb
  );

  assert.equal(await replaceQuestions("auth0|bob", saved.id, sampleQuestions, testDb), null);

  await assert.rejects(
    () => replaceQuestions("auth0|alice", saved.id, [{ question: "Broken", options: ["A"], answerIndex: 0 }], testDb),
    /options/
  );

  const kept = await getQuestionSet("auth0|alice", saved.id, testDb);
  assert.deepEqual(kept.questions.map((q) => q.question), sampleQuestions.map((q) => q.question));
});
