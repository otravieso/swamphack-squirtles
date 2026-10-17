import express from 'express';
import cors from 'cors';
import { config, features } from './config.js';
import { getDb } from './db/db.js';
import meRouter from './routes/me.js';
import questionSetsRouter from './routes/questionSets.js';
import notesRouter from './routes/notes.js';

getDb(); // create the database file + tables on startup

const app = express();
app.use(cors({ origin: config.clientOrigin }));
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true, features }));
app.use('/api/me', meRouter);
app.use('/api/question-sets', questionSetsRouter);
app.use('/api/notes', notesRouter);

// Central error handler (Express 5 forwards async errors here too).
app.use((err, _req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: status === 401 ? 'Please log in' : err.message || 'Server error' });
});

app.listen(config.port, () => {
  console.log(`Server: http://localhost:${config.port}`);
  console.log(`Database: ${config.databasePath}`);
  console.log(`Auth0: ${features.auth0 ? 'ON' : 'OFF (everyone is "guest")'}`);
  console.log(`Gemini: ${features.gemini ? 'ON' : 'OFF (add GEMINI_API_KEY to .env)'}`);
});
