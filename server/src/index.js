
import express from 'express';
import cors from 'cors';
import { config, features } from './config.js';
import { testConnection } from './db/db.js';
import meRouter from './routes/me.js';
import questionSetsRouter from './routes/questionSets.js';

const app = express();

app.use(cors({ origin: config.clientOrigin }));
app.use(express.json({ limit: '2mb' }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, features });
});

// API routes
app.use('/api/me', meRouter);
app.use('/api/question-sets', questionSetsRouter);

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
    });
  } catch (error) {
    console.error('Failed to connect to Tiger Data:', error.message);
    process.exitCode = 1;
  }
}

startServer();
