// Loads the single root-level .env file and exposes config.
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import dotenv from 'dotenv';

const here = path.dirname(fileURLToPath(import.meta.url));
export const ROOT_DIR = path.resolve(here, '..', '..');
dotenv.config({ path: path.join(ROOT_DIR, '.env'), quiet: true });

export const config = {
  port: Number(process.env.PORT) || 3001,
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',

  auth0: {
    domain: process.env.AUTH0_DOMAIN || '',
    audience: process.env.AUTH0_AUDIENCE || '',
    // Custom claim added by the Auth0 Action (see server/src/auth/README.md)
    claimNamespace: 'https://swamphack-squirtles/',
  },

  databasePath: process.env.DATABASE_PATH
    ? path.resolve(ROOT_DIR, process.env.DATABASE_PATH)
    : path.join(ROOT_DIR, 'server', 'data', 'squirtles.db'),
};

export const features = {
  auth0: Boolean(config.auth0.domain && config.auth0.audience),
};
