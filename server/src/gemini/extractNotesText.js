// Turns an uploaded PDF into plain-text notes using Gemini's built-in document
// understanding (works for typed, scanned and handwritten pages, no PDF library needed).
// The text is then passed to generateQuestions() in this folder, unchanged.
import { GoogleGenAI } from '@google/genai';

const PROMPT = `Transcribe the study material in this document into plain text.
Keep headings, lists, definitions, formulas, tables (as simple text) and any handwritten notes.
Skip page numbers, running headers/footers and decorative text.
Do not summarize, explain or add anything. Output only the transcribed text.`;

/**
 * @param {{ mimeType: string, data: string }} file  data = base64 file contents
 * @returns {Promise<string>} the document's text
 */
export async function extractNotesText({ mimeType, data }) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const response = await ai.models.generateContent({
    // Keep in sync with the model in generateQuestions.js.
    model: 'gemini-3.8-flash',
    contents: [
      {
        role: 'user',
        parts: [{ inlineData: { mimeType, data } }, { text: PROMPT }],
      },
    ],
  });

  return (response.text ?? '').trim();
}
