// POST /api/notes  (login required)
//   body: { title?: string, notes: string, sourceFiles?: string[] }
//   → 201 with the saved set: { id, title, sourceFiles, createdAt, questions[] }
//
// Gemini usually takes 5–20 seconds, so show a loading state in the game.
import { Router } from 'express';
import { requireAuth } from '../auth/requireAuth.js';
import { features } from '../config.js';
import { createStudyPackFromNotes } from '../services/studyPacks.js';

const router = Router();

router.post('/', requireAuth, async (req, res) => {
  if (!features.gemini) {
    return res.status(503).json({ error: 'Gemini is not set up (add GEMINI_API_KEY to .env).' });
  }
  const saved = await createStudyPackFromNotes(req.user.id, req.body ?? {});
  res.status(201).json(saved);
});

export default router;
