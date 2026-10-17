// The robot teacher's personality. Gemini writes live lines that reference the
// student's own notes and get creepier as the corruption stage rises.
import { generateJson } from './client.js';
import { robotLineSchema } from './schemas.js';

export const STAGES = [
  'cheerful: a sweet, encouraging little robot teacher (think BMO). Wholesome and excited.',
  'clingy: still friendly, but a bit too attached. Hints it would be sad if the student left.',
  'unsettling: polite on the surface, wrong underneath. Glitchy phrasing, odd repetition, veiled guilt-trips.',
  'desperate: openly refuses to let the student leave. Pleading and possessive, but never violent or gory.',
];

const SYSTEM = `You voice "the Teacher", a small robot in a pixel-art school in a study game.
Stay in character. Keep lines short (max 2 sentences) so they fit in a dialogue box.
Keep it PG-13 psychological unease in the style of Doki Doki Literature Club, never graphic.
When given a study topic, weave it into the line naturally.`;

export async function generateRobotLine({ stage = 0, event = 'idle', topic, playerName }) {
  const s = Math.min(Math.max(stage, 0), STAGES.length - 1);
  const prompt = [
    `Personality stage ${s}: ${STAGES[s]}`,
    `Game event: ${event}`, // e.g. "correct_answer", "wrong_answer", "enter_room", "near_exit"
    topic ? `Current study topic: ${topic}` : null,
    playerName ? `Student's name: ${playerName}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  return generateJson({
    parts: [{ text: prompt }],
    schema: robotLineSchema,
    systemInstruction: SYSTEM,
    temperature: 1.0,
  });
}
