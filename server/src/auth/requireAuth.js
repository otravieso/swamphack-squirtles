// Protects API routes with Auth0.
//
// The browser logs in with Auth0 (username + password), gets an access token,
// and sends it as "Authorization: Bearer <token>". This middleware checks the
// token's signature with Auth0, then makes sure the user exists in our database.
// After it runs, routes can use `req.user` = { id, username, created_at, last_login }.
//
// If AUTH0_DOMAIN / AUTH0_AUDIENCE aren't set yet, every request is treated as a
// single "guest" user so teammates can work before Auth0 is configured.
import { auth } from 'express-oauth2-jwt-bearer';
import { config, features } from '../config.js';
import { upsertUser } from '../db/users.js';

const verifyJwt = features.auth0
  ? auth({
      audience: config.auth0.audience,
      issuerBaseURL: `https://${config.auth0.domain}/`,
      tokenSigningAlg: 'RS256',
    })
  : null;

const ns = config.auth0.claimNamespace;

export function requireAuth(req, res, next) {
  if (!verifyJwt) {
    req.user = upsertUser({ id: 'guest', username: 'guest' });
    return next();
  }

  verifyJwt(req, res, (err) => {
    if (err) return next(err); // 401: missing/expired/invalid token
    const claims = req.auth.payload;
    req.user = upsertUser({
      id: claims.sub, // e.g. "auth0|65f2c…"
      // Added by the Auth0 Post-Login Action (server/src/auth/README.md)
      username: claims[`${ns}username`] ?? null,
    });
    next();
  });
}
