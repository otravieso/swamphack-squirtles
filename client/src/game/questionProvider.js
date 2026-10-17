// QUESTION CONTRACT (the AI/Gemini teammate implements this):
//   { id: string, prompt: string, choices: string[], correctIndex: number, explanation?: string }
// Plug in with:  setQuestionProvider(async ({ difficulty, seen }) => { ...return question })
//   difficulty = 0..1 (rises as the AI gets more aggressive), seen = ids already asked.
// Example: setQuestionProvider(() => fetch('/api/questions/next').then(r => r.json()))
const STAND_IN = [
  { id: 's1', prompt: 'What is the powerhouse of the cell?', choices: ['Nucleus', 'Mitochondria', 'Ribosome', 'Golgi body'], correctIndex: 1, explanation: 'Mitochondria produce most of the cell\'s ATP.' },
  { id: 's2', prompt: 'What is 7 x 8?', choices: ['54', '56', '48', '64'], correctIndex: 1 },
  { id: 's3', prompt: 'Which planet is closest to the sun?', choices: ['Venus', 'Earth', 'Mercury', 'Mars'], correctIndex: 2 },
  { id: 's4', prompt: 'Who wrote "Romeo and Juliet"?', choices: ['Dickens', 'Shakespeare', 'Austen', 'Twain'], correctIndex: 1 },
  { id: 's5', prompt: 'What is the chemical symbol for water?', choices: ['O2', 'CO2', 'H2O', 'HO'], correctIndex: 2 },
];
let provider = async ({ seen = [] }) =>
  STAND_IN.find((q) => !seen.includes(q.id)) || STAND_IN[Math.floor(Math.random() * STAND_IN.length)];
export const setQuestionProvider = (fn) => { provider = fn; };
export const getQuestion = (ctx) => provider(ctx);
