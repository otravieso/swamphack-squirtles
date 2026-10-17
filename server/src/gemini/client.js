// Single shared Gemini client. The API key lives ONLY on the server.
import { GoogleGenAI } from '@google/genai';
import { config, features } from '../config.js';

export const ai = features.gemini ? new GoogleGenAI({ apiKey: config.gemini.apiKey }) : null;

/**
 * Ask Gemini for JSON that matches `schema`. Returns the parsed object.
 * Retries once on rate limits (HTTP 429), which free-tier keys hit easily.
 */
export async function generateJson({ parts, schema, systemInstruction, temperature = 0.7 }) {
  if (!ai) throw new Error('Gemini is not configured (set GEMINI_API_KEY in .env)');

  const request = {
    model: config.gemini.model,
    contents: [{ role: 'user', parts }],
    config: {
      systemInstruction,
      temperature,
      responseMimeType: 'application/json',
      responseSchema: schema,
    },
  };

  try {
    const res = await ai.models.generateContent(request);
    return JSON.parse(res.text);
  } catch (err) {
    if (String(err?.status ?? err?.message).includes('429')) {
      await new Promise((r) => setTimeout(r, 5000));
      const res = await ai.models.generateContent(request);
      return JSON.parse(res.text);
    }
    throw err;
  }
}
