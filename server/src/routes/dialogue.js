// POST /api/dialogue  { stage, event, topic }: the robot's next line.
import { Router } from 'express';
import { requireAuth } from '../auth/requireAuth.js';
import { features } from '../config.js';
import { generateRobotLine } from '../gemini/robotDialogue.js';
import { sampleRobotLines } from '../mock/sampleStudyPack.js';
import { getPlayer } from '../store/progressStore.js';

const router = Router();
const MOODS = ['cheerful', 'clingy', 'unsettling', 'desperate'];

router.post('/', requireAuth, async (req, res) => {
  const stage = Math.min(Math.max(Number(req.body.stage) || 0, 0), 3);
  const fallback = { line: sampleRobotLines[stage], mood: MOODS[stage], fallback: true };

  if (!features.gemini) return res.json(fallback);

  try {
    const player = getPlayer(req.userId);
    const line = await generateRobotLine({
      stage,
      event: String(req.body.event || 'idle').slice(0, 40),
      topic: req.body.topic ? String(req.body.topic).slice(0, 80) : undefined,
      playerName: player?.playerName,
    });
    res.json(line);
  } catch (err) {
    // Dialogue is flavor: never break the game if Gemini hiccups.
    console.warn('Dialogue generation failed:', err.message);
    res.json(fallback);
  }
});

export default router;
