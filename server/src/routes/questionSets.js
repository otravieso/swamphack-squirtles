
// Saved question sets for the logged-in user.
// Auth0 verifies the user before any database operation.

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

// Get all study packs belonging to the logged-in user.
router.get('/', async (req, res, next) => {
  try {
    const sets = await listQuestionSets(req.user.id);
    res.json(sets);
  } catch (error) {
    next(error);
  }
});

// Save a new study pack and its questions.
router.post('/', async (req, res, next) => {
  try {
    const { title, sourceFiles, questions } = req.body ?? {};

    if (!title) {
      return res.status(400).json({ error: 'title is required' });
    }

    const saved = await saveQuestionSet(req.user.id, {
      title,
      sourceFiles,
      questions,
    });

    res.status(201).json(saved);
  } catch (error) {
    next(error);
  }
});

// Get one study pack with its questions.
router.get('/:id', async (req, res, next) => {
  try {
    const set = await getQuestionSet(req.user.id, Number(req.params.id));

    if (!set) {
      return res.status(404).json({ error: 'Question set not found' });
    }

    res.json(set);
  } catch (error) {
    next(error);
  }
});

// Delete a study pack and its questions.
router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await deleteQuestionSet(
      req.user.id,
      Number(req.params.id)
    );

    if (!deleted) {
      return res.status(404).json({ error: 'Question set not found' });
    }

    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;
