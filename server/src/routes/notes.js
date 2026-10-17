// POST /api/notes: upload notes → Gemini builds the study pack → saved to the player.
import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../auth/requireAuth.js';
import { features } from '../config.js';
import { generateStudyPack } from '../gemini/studyPack.js';
import { sampleStudyPack } from '../mock/sampleStudyPack.js';
import { setPlayer } from '../store/progressStore.js';
import { publicPack } from './progress.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024, files: 10 },
});

const router = Router();

router.post('/', requireAuth, upload.array('notes', 10), async (req, res) => {
  const files = req.files || [];
  let pack;

  if (features.gemini) {
    if (files.length === 0) {
      return res.status(400).json({ error: 'Upload at least one notes file.' });
    }
    pack = await generateStudyPack(files);
  } else {
    pack = structuredClone(sampleStudyPack);
  }

  const player = setPlayer(req.userId, {
    pack,
    answers: {}, // questionId -> { correct, choiceIndex }
    playerName: req.body.playerName || null,
  });

  res.json({ usingSample: !features.gemini, ...publicPack(player) });
});

export default router;
