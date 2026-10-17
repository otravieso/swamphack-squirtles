// Player progress + answer checking. Answers are graded on the server so the
// correct answers never ship to the browser before the player answers.
import { Router } from 'express';
import { requireAuth } from '../auth/requireAuth.js';
import { getPlayer, updatePlayer } from '../store/progressStore.js';

const router = Router();
const STAGE_COUNT = 4;

export function summarize(player) {
  const total = player.pack.questions.length;
  const answers = Object.values(player.answers || {});
  const correct = answers.filter((a) => a.correct).length;
  const stage = Math.min(STAGE_COUNT - 1, Math.floor((correct / Math.max(total, 1)) * STAGE_COUNT));
  return { total, answered: answers.length, correct, stage, finished: correct >= total };
}

/** Everything the client needs, minus the answer key. */
export function publicPack(player) {
  const { subject, topics, questions } = player.pack;
  return {
    subject,
    topics,
    questions: questions.map(({ id, question, options, topic, difficulty }) => ({
      id,
      question,
      options,
      topic,
      difficulty,
      answered: Boolean(player.answers?.[id]?.correct),
    })),
    progress: summarize(player),
  };
}

// GET /api/progress: resume a saved game
router.get('/', requireAuth, (req, res) => {
  const player = getPlayer(req.userId);
  if (!player?.pack) return res.json({ hasGame: false });
  res.json({ hasGame: true, ...publicPack(player) });
});

// POST /api/progress/answer  { questionId, choiceIndex }
router.post('/answer', requireAuth, (req, res) => {
  const player = getPlayer(req.userId);
  if (!player?.pack) return res.status(404).json({ error: 'No game in progress. Upload notes first.' });

  const { questionId, choiceIndex } = req.body;
  const q = player.pack.questions.find((x) => x.id === Number(questionId));
  if (!q) return res.status(400).json({ error: 'Unknown question.' });

  const correct = Number(choiceIndex) === q.answerIndex;
  const prev = player.answers?.[q.id];
  const answers = {
    ...player.answers,
    // Once answered correctly, it stays correct.
    [q.id]: { correct: correct || Boolean(prev?.correct), choiceIndex },
  };
  const updated = updatePlayer(req.userId, { answers });

  res.json({
    correct,
    correctIndex: q.answerIndex,
    explanation: q.explanation,
    sourceQuote: q.sourceQuote || null,
    progress: summarize(updated),
  });
});

export default router;
