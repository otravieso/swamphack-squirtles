// Wires up the TEMPORARY test page in index.html.
// When the game exists, its entry point replaces this file. Keep calling
// initAuth() once at startup and use `api` for everything else.
import { api } from './api/api.js';
import { authEnabled, initAuth, login, logout, signup } from './auth/auth.js';

const $ = (id) => document.getElementById(id);
const show = (data) => {
  $('output').textContent = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
};
const run = (fn) => async () => {
  show('Working…');
  try {
    show((await fn()) ?? 'Done.');
  } catch (err) {
    show(`Error: ${err.message}`);
  }
};

const sampleSet = {
  title: 'Sample: Cell Biology',
  sourceFiles: ['bio-notes.pdf'],
  questions: [
    {
      question: 'Which organelle is the powerhouse of the cell?',
      options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Golgi apparatus'],
      answerIndex: 1,
      explanation: 'Mitochondria produce ATP through cellular respiration.',
      topic: 'Organelles',
      difficulty: 1,
    },
    {
      question: 'Movement of water across a membrane is called…',
      options: ['Diffusion', 'Active transport', 'Osmosis', 'Endocytosis'],
      answerIndex: 2,
      explanation: 'Osmosis is the diffusion of water across a selectively permeable membrane.',
      topic: 'Cell Membrane',
      difficulty: 3,
    },
  ],
};

(async () => {
  const health = await api.health().catch(() => null);
  if (!health) {
    $('status').textContent = 'Cannot reach the server. Is `npm run dev` running?';
    return;
  }
  if (!health.features.gemini) $('generate').title = 'Add GEMINI_API_KEY to .env first';
  const { user, error } = await initAuth().catch((err) => {
    console.error(err);
    return { user: null, error: err.message };
  });
  $('status').textContent = !authEnabled
    ? 'Auth0 not configured yet (fill in .env). Everything is saved as "guest".'
    : user
      ? `Logged in as ${user.username || user.nickname || user.name}`
      : 'Not logged in. Saving questions requires logging in.';
  if (error) show(`Auth0 login error → ${error}`);
})();

$('signup').onclick = run(() => signup());
$('login').onclick = run(() => login());
$('logout').onclick = run(() => logout());
$('me').onclick = run(() => api.me());
$('save').onclick = run(() => api.saveQuestionSet(sampleSet));
$('list').onclick = run(() => api.listQuestionSets());
$('get').onclick = run(() => api.getQuestionSet($('set-id').value));
$('delete').onclick = run(() => api.deleteQuestionSet($('set-id').value));

// Notes → Gemini → database
let loadedFileName = null;
$('notes-file').onchange = async () => {
  const file = $('notes-file').files[0];
  if (!file) return;
  $('notes-text').value = await file.text();
  loadedFileName = file.name;
  if (!$('notes-title').value) $('notes-title').value = file.name.replace(/\.[^.]+$/, '');
};
$('generate').onclick = async () => {
  const button = $('generate');
  button.disabled = true;
  show('Asking Gemini… this usually takes 5–20 seconds.');
  try {
    const saved = await api.generateQuestions({
      title: $('notes-title').value,
      notes: $('notes-text').value,
      sourceFiles: loadedFileName ? [loadedFileName] : [],
    });
    $('set-id').value = saved.id;
    show(saved);
  } catch (err) {
    show(`Error: ${err.message}`);
  } finally {
    button.disabled = false;
  }
};
