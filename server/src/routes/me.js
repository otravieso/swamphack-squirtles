// GET /api/me → the logged-in user's database record.
// Handy for confirming login works end to end.
import { Router } from 'express';
import { requireAuth } from '../auth/requireAuth.js';

const router = Router();

router.get('/', requireAuth, (req, res) => {
  res.json(req.user);
});

export default router;
