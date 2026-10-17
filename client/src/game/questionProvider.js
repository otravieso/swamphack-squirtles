// Contract: { id, prompt, choices, correctIndex, explanation? }
// Gemini teammate: setQuestionProvider(async ({ difficulty, seen }) => { ... });
const STAND_IN = [
  { id: 's1', prompt: 'What is the powerhouse of the cell?', choices: ['Nucleus', 'Mitochondria', 'Ribosome', 'Golgi body'], correctIndex: 1, explanation: 'Mitochondria produce most of the cell\'s ATP.' },
  { id: 's2', prompt: 'What is 7 x 8?', choices: ['54', '56', '48', '64'], correctIndex: 1 },
  { id: 's3', prompt: 'Which planet is closest to the sun?', choices: ['Venus', 'Earth', 'Mercury', 'Mars'], correctIndex: 2 },
  { id: 's4', prompt: 'Who wrote "Romeo and Juliet"?', choices: ['Dickens', 'Shakespeare', 'Austen', 'Twain'], correctIndex: 1 },
  { id: 's5', prompt: 'What is the chemical symbol for water?', choices: ['O2', 'CO2', 'H2O', 'HO'], correctIndex: 2 },
];
let provider = async ({ seen = [] }) => {
  const next = STAND_IN.find(q => !seen.includes(q.id));
  if (!next) throw new Error('No unused questions remain. Add more questions or connect Gemini.');
  return next;
};
export function setQuestionProvider(fn) {
  if (typeof fn !== 'function') throw new TypeError('Question provider must be a function');
  provider = fn;
}
export function getQuestion(ctx) { return provider(ctx); }
