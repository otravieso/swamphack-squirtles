
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import cors from 'cors';
import { config, features, ROOT_DIR } from './config.js';
import { testConnection } from './db/db.js';
import meRouter from './routes/me.js';
import questionSetsRouter from './routes/questionSets.js';
import notesRouter from './routes/notes.js';

const app = express();

app.use(cors({ origin: config.clientOrigin }));
// /api/notes accepts PDF uploads (base64 inside JSON), so it gets a bigger limit.
// It must come before the general 2 MB parser below.
app.use('/api/notes', express.json({ limit: '25mb' }));
app.use(express.json({ limit: '2mb' }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, features });
});

// API routes
app.use('/api/me', meRouter);
app.use('/api/question-sets', questionSetsRouter);
app.use('/api/notes', notesRouter);

// Production: serve the built React app (client/dist) from this same server.
// Locally, Vite serves the client instead, so this only kicks in after
// `npm run build -w client`.
const clientDist = path.join(ROOT_DIR, 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  // Any non-API URL gets the React app's index.html
  app.get(/^(?!\/api(\/|$)).*/, (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Central error handler
app.use((err, _req, res, _next) => {
  const status = err.status || err.statusCode || 500;

  if (status >= 500) {
    console.error(err);
  }

  res.status(status).json({
    error: status === 401
      ? 'Please log in'
      : err.message || 'Server error',
  });
});

// Start the server only after PostgreSQL is connected.
async function startServer() {
  try {
    await testConnection();

    console.log('Connected to Tiger Data PostgreSQL!');

    app.listen(config.port, () => {
      console.log(`Server: http://localhost:${config.port}`);
      console.log('Database: Tiger Data PostgreSQL');
      console.log(
        `Auth0: ${features.auth0 ? 'ON' : 'OFF (guest mode)'}`
      );
      console.log(
        `Gemini: ${features.gemini ? 'ON' : 'OFF (add GEMINI_API_KEY to .env)'}`
      );
    });
  } catch (error) {
    console.error('Failed to connect to Tiger Data:', error.message);
    process.exitCode = 1;
  }
}

startServer();
