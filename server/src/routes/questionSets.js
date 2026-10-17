// Saved question sets for the logged-in user.
//
//   GET    /api/question-sets        → list of the user's sets (no questions)
//   POST   /api/question-sets        → save a set   body: { title, sourceFiles?, questions[] }
//   GET    /api/question-sets/:id    → one set with all its questions
//   DELETE /api/question-sets/:id    → delete a set
//
// When the Gemini code exists, it can call saveQuestionSet() directly after
// generating questions instead of going through POST.
import { Router } from 'express';
import { requireAuth } from '../auth/requireAuth.js';
import {
  saveQuestionSet,
  listQuestionSets,
  getQuestionSet,
  deleteQuestionSet,
} from '../db/questionSets.js';

const router = Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  res.json(listQuestionSets(req.user.id));
});

router.post('/', (req, res) => {
  const { title, sourceFiles, questions } = req.body ?? {};
  if (!title) return res.status(400).json({ error: 'title is required' });
  const saved = saveQuestionSet(req.user.id, { title, sourceFiles, questions });
  res.status(201).json(saved);
});

router.get('/:id', (req, res) => {
  const set = getQuestionSet(req.user.id, Number(req.params.id));
  if (!set) return res.status(404).json({ error: 'Question set not found' });
  res.json(set);
});

router.delete('/:id', (req, res) => {
  const deleted = deleteQuestionSet(req.user.id, Number(req.params.id));
  if (!deleted) return res.status(404).json({ error: 'Question set not found' });
  res.status(204).end();
});

export default router;
