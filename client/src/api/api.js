// Calls to our server. The logged-in user's Auth0 token is attached automatically,
// so the server knows whose questions to save or return.
//
//   import { api } from './api/api.js';
//   const me = await api.me();
//   const saved = await api.saveQuestionSet({ title: 'Bio Ch. 3', questions });
//   const sets = await api.listQuestionSets();
//   const pack = await api.generateQuestions({ title: 'Bio Ch. 3', notes: '...' });
import { getToken } from '../auth/auth.js';

async function request(path, { method = 'GET', body } = {}) {
  const headers = {};
  const token = await getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  /** { ok, features: { auth0, gemini } } */
  health: () => request('/health'),

  /** { id, username, created_at, last_login } */
  me: () => request('/me'),

  /** [{ id, title, sourceFiles, createdAt, questionCount }] */
  listQuestionSets: () => request('/question-sets'),

  /** { id, title, sourceFiles, createdAt, questions: [{ id, question, options, answerIndex, explanation, topic, difficulty, sourceQuote }] } */
  getQuestionSet: (id) => request(`/question-sets/${id}`),

  /**
   * Save generated questions.
   * @param {{ title: string, sourceFiles?: string[], questions: Array<{ question: string, options: string[], answerIndex: number, explanation?: string, topic?: string, difficulty?: number, sourceQuote?: string }> }} set
   */
  saveQuestionSet: (set) => request('/question-sets', { method: 'POST', body: set }),

  deleteQuestionSet: (id) => request(`/question-sets/${id}`, { method: 'DELETE' }),

  /**
   * Send notes and/or a PDF to Gemini, which generates questions; the server saves them
   * for this player and returns the saved set (same shape as getQuestionSet).
   * Takes ~5–20 s for text, longer for PDFs, so show a loading state.
   * @param {{ title?: string, notes?: string, sourceFiles?: string[],
   *           file?: { name: string, mimeType: 'application/pdf', data: string } }} input
   *   file.data = the PDF as base64 (max 15 MB)
   */
  generateQuestions: (input) => request('/notes', { method: 'POST', body: input }),

  /**
   * "Play again": Gemini writes a fresh round of questions from the notes saved with this
   * set, and they replace the old questions. Returns the updated set (same id, same shape
   * as getQuestionSet). Takes ~5–20 s. Fails with a message if the set has no saved notes
   * (sets made before notes were stored); the old questions are kept on any failure.
   */
  regenerateQuestionSet: (id) => request(`/question-sets/${id}/regenerate`, { method: 'POST' }),
};
