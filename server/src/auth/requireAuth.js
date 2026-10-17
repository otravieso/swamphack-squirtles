
import { auth } from 'express-oauth2-jwt-bearer';
import { config, features } from '../config.js';
import { upsertUser } from '../db/users.js';

// Auth0 still handles token verification.
const verifyJwt = features.auth0
  ? auth({
      audience: config.auth0.audience,
      issuerBaseURL: `https://${config.auth0.domain}/`,
      tokenSigningAlg: 'RS256',
    })
  : null;

const ns = config.auth0.claimNamespace;

export async function requireAuth(req, res, next) {
  // Guest mode for development when Auth0 is not configured.
  if (!verifyJwt) {
    try {
      req.user = await upsertUser({
        id: 'guest',
        username: 'guest',
      });

      return next();
    } catch (error) {
      return next(error);
    }
  }

  // Verify the access token using Auth0.
  verifyJwt(req, res, async (err) => {
    if (err) return next(err);

    try {
      const claims = req.auth.payload;

      // Save or update the verified user in PostgreSQL.
      req.user = await upsertUser({
        id: claims.sub,
        username: claims[`${ns}username`] ?? null,
      });

      next();
    } catch (error) {
      next(error);
    }
  });
}
