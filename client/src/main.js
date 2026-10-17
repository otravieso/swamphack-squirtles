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
const MAX_PDF_BYTES = 15 * 1024 * 1024;
let loadedFileName = null; // a .txt/.md file loaded into the text box
let loadedPdf = null; // { name, mimeType, data(base64) }, read by Gemini on the server

const readAsBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]); // strip "data:...;base64,"
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

$('notes-file').onchange = async () => {
  const file = $('notes-file').files[0];
  loadedFileName = null;
  loadedPdf = null;
  if (!file) return;
  if (!$('notes-title').value) $('notes-title').value = file.name.replace(/\.[^.]+$/, '');

  if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) {
    if (file.size > MAX_PDF_BYTES) {
      $('notes-file').value = '';
      return show('Error: that PDF is too large (max 15 MB).');
    }
    loadedPdf = { name: file.name, mimeType: 'application/pdf', data: await readAsBase64(file) };
    show(`PDF ready: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB). Click "Generate & save questions".`);
  } else {
    $('notes-text').value = await file.text();
    loadedFileName = file.name;
  }
};

$('generate').onclick = async () => {
  const button = $('generate');
  button.disabled = true;
  show(loadedPdf
    ? 'Gemini is reading your PDF and writing questions… this can take 15–60 seconds.'
    : 'Asking Gemini… this usually takes 5–20 seconds.');
  try {
    const saved = await api.generateQuestions({
      title: $('notes-title').value,
      notes: $('notes-text').value,
      sourceFiles: loadedFileName ? [loadedFileName] : [],
      file: loadedPdf ?? undefined,
    });
    $('set-id').value = saved.id;
    show(saved);
  } catch (err) {
    show(`Error: ${err.message}`);
  } finally {
    button.disabled = false;
  }
};
