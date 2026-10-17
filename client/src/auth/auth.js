// Auth0 login for the browser, using OUR OWN login form (components/LoginPage.jsx).
//
// The form sends the username + password straight to Auth0 (password-realm grant)
// and keeps the returned tokens in localStorage. Auth0 still stores and checks the
// passwords; we never save them. Setup steps: client/src/auth/README.md
//
//   import { initAuth, loginWithPassword, registerWithPassword, logout } from './auth/auth.js';
//   const { user } = await initAuth();            // once at startup; user is null if logged out
//   await loginWithPassword('squirtle', 'pw');    // throws { code, description } on failure

const domain = import.meta.env.VITE_AUTH0_DOMAIN;
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
const audience = import.meta.env.VITE_AUTH0_AUDIENCE;
// Name of the Auth0 database connection (Authentication -> Database).
const connection = import.meta.env.VITE_AUTH0_CONNECTION || 'Username-Password-Authentication';

/** False until the VITE_AUTH0_* values are filled in .env (then login is skipped, "guest" mode) */
export const authEnabled = Boolean(domain && clientId && audience);

const STORAGE_KEY = 'squirtles.session';

function readSession() {
  try {
    const session = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (session && session.expiresAt > Date.now() + 5000) return session;
  } catch {
    // corrupted or blocked storage: treat as logged out
  }
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  return null;
}

function decodeJwt(token) {
  try {
    const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = part + '='.repeat((4 - (part.length % 4)) % 4);
    return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(padded), (c) => c.charCodeAt(0))));
  } catch {
    return {};
  }
}

function toUser(idToken) {
  const claims = decodeJwt(idToken);
  const username = claims.nickname || claims.name || null;
  return { sub: claims.sub, username, nickname: username, name: claims.name || username };
}

async function postJson(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Normalise Auth0's different error shapes into { code, description }
    const error = new Error(data.error_description || data.message || `Request failed (${res.status})`);
    error.code = data.code || data.error || '';
    error.description = data.error_description || data.description;
    throw error;
  }
  return data;
}

/** Check for a saved login. @returns {Promise<{ enabled: boolean, user: object|null }>} */
export async function initAuth() {
  if (!authEnabled) return { enabled: false, user: null };
  const session = readSession();
  return { enabled: true, user: session ? session.user : null };
}

/** Log in with username + password. Resolves with the user, throws on a wrong password etc. */
export async function loginWithPassword(username, password) {
  const data = await postJson(`https://${domain}/oauth/token`, {
    grant_type: 'http://auth0.com/oauth/grant-type/password-realm',
    realm: connection,
    username,
    password,
    audience,
    scope: 'openid profile',
    client_id: clientId,
  });
  const user = toUser(data.id_token);
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      accessToken: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
      user,
    }),
  );
  return user;
}

/** Create an account, then log straight in. */
export async function registerWithPassword(username, password) {
  await postJson(`https://${domain}/dbconnections/signup`, {
    client_id: clientId,
    connection,
    username,
    password,
  });
  return loginWithPassword(username, password);
}

/** Forget the login and reload so the app returns to the login page. */
export function logout() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  window.location.reload();
}

/** Access token for our server, or null if not logged in. Used by src/api/. */
export async function getToken() {
  const session = readSession();
  return session ? session.accessToken : null;
}