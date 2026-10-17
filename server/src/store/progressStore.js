// Tiny JSON-file store for each player's questions + progress.
// Good enough for a hackathon; swap for a real database (e.g. a Vultr
// Managed Database) later without touching the routes.
import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';

const FILE = path.join(config.dataDir, 'progress.json');
let cache = null;

function load() {
  if (cache) return cache;
  try {
    cache = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch {
    cache = {};
  }
  return cache;
}

function save() {
  fs.mkdirSync(config.dataDir, { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(cache, null, 2));
}

export function getPlayer(userId) {
  return load()[userId] || null;
}

export function setPlayer(userId, data) {
  load()[userId] = { ...data, updatedAt: new Date().toISOString() };
  save();
  return cache[userId];
}

export function updatePlayer(userId, patch) {
  const current = getPlayer(userId) || {};
  return setPlayer(userId, { ...current, ...patch });
}
