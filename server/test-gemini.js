import "./src/config.js";
import { generateQuestions } from "./src/gemini/generateQuestions.js";

const notes = `
Photosynthesis is the process by which plants convert
sunlight into chemical energy.

Plants absorb sunlight using chlorophyll.

Photosynthesis takes place in chloroplasts.

Plants use carbon dioxide and water to produce
glucose and oxygen.
`;

try {
  console.log("Asking Gemini to generate questions...");

  const questions = await generateQuestions(notes);

  console.log(JSON.stringify(questions, null, 2));
} catch (error) {
  console.error("Error:", error.message);
}