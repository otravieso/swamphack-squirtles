// Connects a saved question set (from Gemini / the database) to the game.
//
// Database / Gemini shape:  { id, question, options[], answerIndex, explanation, topic, difficulty }
// Game shape (questionProvider.js contract): { id, prompt, choices[], correctIndex, explanation? }
//
// Uses the game's own setQuestionProvider() hook, so game files don't need to change.
import { setQuestionProvider } from './questionProvider.js';

/** Convert one saved question into the shape the game expects. */
export function toGameQuestion(q) {
  return {
    id: String(q.id),
    prompt: q.question,
    choices: q.options,
    correctIndex: q.answerIndex,
    explanation: q.explanation ?? undefined,
  };
}

/**
 * Build a question provider for the game from a saved set.
 * Gives each question once (in order); after all are used, repeats random ones
 * so a long story never runs out.
 */
export function makeQuestionSetProvider(questionSet) {
  const pool = (questionSet?.questions ?? []).map(toGameQuestion);
  if (pool.length === 0) throw new Error('This question set has no questions.');
  return async ({ seen = [] } = {}) =>
    pool.find((q) => !seen.includes(q.id)) ?? pool[Math.floor(Math.random() * pool.length)];
}

// The set the game is asking from, and a newer one waiting for the next run.
let current = null;
let pending = null;

/** Make the game ask questions from this saved set. Call before showing <GameApp />. */
export function loadQuestionSetIntoGame(questionSet) {
  current = makeQuestionSetProvider(questionSet);
  pending = null;
  setQuestionProvider(async (ctx = {}) => {
    // A run's first question has nothing seen yet: that's when a waiting set takes over,
    // so new questions never get mixed into a run that's already going.
    if (pending && !(ctx.seen?.length)) {
      current = pending;
      pending = null;
    }
    return current(ctx);
  });
}

/**
 * "Play again": use this (regenerated) set starting with the next run's first question.
 * Call after loadQuestionSetIntoGame().
 */
export function queueQuestionSetForNextRun(questionSet) {
  pending = makeQuestionSetProvider(questionSet);
}
