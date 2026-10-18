// The question mix for every round: how many questions of each type Gemini writes.
// To make rounds longer later, raise these numbers (the total is the round length).
//
// Every type is saved in the same format as before, { question, options[], answerIndex, ... },
// so the database, the adapter and the game's choice buttons work unchanged:
//   multipleChoice  4 options
//   trueFalse       options are always ["True", "False"]
//   fillInBlank     a sentence from the notes with a key term replaced by "_____", 4 options
export const QUESTION_MIX = {
  multipleChoice: 5,
  trueFalse: 2,
  fillInBlank: 3,
};

export const QUESTION_TYPES = Object.keys(QUESTION_MIX);

const TRUE_FALSE = ['True', 'False'];
const BLANK = /_{3,}/; // three or more underscores
const STANDARD_BLANK = '_____';

/** Copy of `items` in random order (Fisher-Yates). `random` is swappable for tests. */
export function shuffle(items, random = Math.random) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * The type of each question in a round: exactly the counts in the mix, in random order.
 * e.g. ['trueFalse', 'multipleChoice', 'fillInBlank', ...]
 */
export function makeTypePlan(mix = QUESTION_MIX, random = Math.random) {
  const plan = Object.entries(mix).flatMap(([type, count]) => Array(count).fill(type));
  return shuffle(plan, random);
}

/**
 * Check and clean one question from Gemini so it fits its type.
 * Returns the cleaned question, or null if it can't be used.
 * Multiple-choice and fill-in options are shuffled, so the right answer isn't always first.
 */
export function normalizeQuestion(q, random = Math.random) {
  if (!q || typeof q.question !== 'string' || !q.question.trim() || !Array.isArray(q.options)) return null;
  const options = q.options.map((o) => (typeof o === 'string' ? o.trim() : ''));
  if (!Number.isInteger(q.answerIndex) || q.answerIndex < 0 || q.answerIndex >= options.length) return null;

  const type = QUESTION_TYPES.includes(q.type) ? q.type : 'multipleChoice';
  const correct = options[q.answerIndex];
  let question = q.question.trim();

  if (type === 'trueFalse') {
    const value = correct.toLowerCase();
    if (value !== 'true' && value !== 'false') return null;
    return { ...q, type, question, options: [...TRUE_FALSE], answerIndex: value === 'true' ? 0 : 1 };
  }

  // multipleChoice and fillInBlank: exactly 4 different, non-empty options.
  const distinct = new Set(options.map((o) => o.toLowerCase()));
  if (options.length !== 4 || options.some((o) => !o) || distinct.size !== 4) return null;

  if (type === 'fillInBlank') {
    if (!BLANK.test(question)) return null;
    question = question.replace(/_{3,}/g, STANDARD_BLANK);
  }

  const shuffled = shuffle(options, random);
  return { ...q, type, question, options: shuffled, answerIndex: shuffled.indexOf(correct) };
}
