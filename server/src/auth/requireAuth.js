// Auth0 challenge: verifies the access token the game gets from Auth0.
// If Auth0 isn't configured yet, everyone is treated as a single "guest" player
// so the team can build the game without accounts.
import { auth } from 'express-oauth2-jwt-bearer';
import { config, features } from '../config.js';

const verifyJwt = features.auth0
  ? auth({
      audience: config.auth0.audience,
      issuerBaseURL: `https://${config.auth0.domain}/`,
      tokenSigningAlg: 'RS256',
    })
  : null;

export function requireAuth(req, res, next) {
  if (!verifyJwt) {
    req.userId = 'guest';
    return next();
  }
  verifyJwt(req, res, (err) => {
    if (err) return next(err);
    req.userId = req.auth.payload.sub; // e.g. "google-oauth2|1234"
    next();
  });
}
