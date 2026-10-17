// All calls to our own server. The browser never talks to Gemini directly,
// which keeps the API key secret.
import { getToken } from '../auth/auth.js';

async function request(path, { method = 'GET', body, form } = {}) {
  const headers = {};
  const token = await getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: form ?? (body ? JSON.stringify(body) : undefined),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  health: () => request('/health'),
  loadProgress: () => request('/progress'),

  uploadNotes(files, playerName) {
    const form = new FormData();
    for (const f of files) form.append('notes', f);
    if (playerName) form.append('playerName', playerName);
    return request('/notes', { method: 'POST', form });
  },

  answer: (questionId, choiceIndex) =>
    request('/progress/answer', { method: 'POST', body: { questionId, choiceIndex } }),

  robotLine: (stage, event, topic) =>
    request('/dialogue', { method: 'POST', body: { stage, event, topic } }),
};
