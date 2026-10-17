// Loads the single root-level .env file and exposes typed config.
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import dotenv from 'dotenv';

const here = path.dirname(fileURLToPath(import.meta.url));
export const ROOT_DIR = path.resolve(here, '..', '..');
dotenv.config({ path: path.join(ROOT_DIR, '.env') });

export const config = {
  port: Number(process.env.PORT) || 3001,
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',

  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  },

  auth0: {
    domain: process.env.AUTH0_DOMAIN || '',
    audience: process.env.AUTH0_AUDIENCE || '',
  },

  dataDir: path.join(ROOT_DIR, 'server', 'data'),
  clientDist: path.join(ROOT_DIR, 'client', 'dist'),

  // Game tuning
  questionCount: 20,
};

export const features = {
  gemini: Boolean(config.gemini.apiKey),
  auth0: Boolean(config.auth0.domain && config.auth0.audience),
};
