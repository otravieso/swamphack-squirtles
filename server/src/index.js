import fs from 'node:fs';
import express from 'express';
import cors from 'cors';
import { config, features } from './config.js';
import notesRouter from './routes/notes.js';
import dialogueRouter from './routes/dialogue.js';
import progressRouter from './routes/progress.js';

const app = express();

app.use(cors({ origin: config.clientOrigin }));
app.use(express.json({ limit: '1mb' }));

// Health check: also tells the client which integrations are switched on.
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, features, model: config.gemini.model });
});

app.use('/api/notes', notesRouter);
app.use('/api/dialogue', dialogueRouter);
app.use('/api/progress', progressRouter);

// In production (e.g. on Vultr), serve the built game from the same server.
if (fs.existsSync(config.clientDist)) {
  app.use(express.static(config.clientDist));
  app.get(/^(?!\/api\/).*/, (_req, res) => {
    res.sendFile('index.html', { root: config.clientDist });
  });
}

// Central error handler (Express 5 forwards async errors here).
app.use((err, _req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: err.message || 'Something went wrong' });
});

app.listen(config.port, () => {
  console.log(`🤖 Server listening on http://localhost:${config.port}`);
  console.log(
    `   Gemini: ${features.gemini ? `ON (${config.gemini.model})` : 'OFF, using sample questions'}`
  );
  console.log(`   Auth0:  ${features.auth0 ? 'ON' : 'OFF, everyone plays as guest'}`);
});
