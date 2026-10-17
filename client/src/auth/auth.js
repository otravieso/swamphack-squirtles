// Auth0 login for the browser.
//
// Login and sign-up happen on Auth0's hosted page (Universal Login), which shows
// the username + password form. Users come back to the game already logged in.
// Passwords never pass through our code.
//
//   import { initAuth, login, signup, logout } from './auth/auth.js';
//   const { user } = await initAuth();   // call once when the game starts
//   if (!user) login();
import { Auth0Client } from '@auth0/auth0-spa-js';

const domain = import.meta.env.VITE_AUTH0_DOMAIN;
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
const audience = import.meta.env.VITE_AUTH0_AUDIENCE;

/** False until the VITE_AUTH0_* values are filled in .env */
export const authEnabled = Boolean(domain && clientId && audience);

let client = null;

/**
 * Set up Auth0 and finish a login if we just came back from the login page.
 * @returns {Promise<{ enabled: boolean, user: object|null }>}
 */
export async function initAuth() {
  if (!authEnabled) return { enabled: false, user: null };

  // Create the client WITHOUT the automatic "already logged in?" check, so that
  // a failing check can't stop the login / sign-up buttons from working.
  client = new Auth0Client({
    domain,
    clientId,
    cacheLocation: 'localstorage', // stay logged in across page reloads
    authorizationParams: { redirect_uri: window.location.origin, audience },
  });

  // Coming back from the Auth0 page: either a login code or an error.
  const params = new URLSearchParams(window.location.search);
  let error = null;
  const returningFromAuth0 = params.has('code') || params.has('error');
  if (!returningFromAuth0) {
    try {
      await client.checkSession();
    } catch (err) {
      error = `session check failed (${err.error || err.message}). ` +
        'Check "Allowed Web Origins" = http://localhost:5173 in the Auth0 app settings.';
    }
  }
  if (params.has('error')) {
    error = `${params.get('error')}: ${params.get('error_description') || ''}`;
  } else if (params.has('code') && params.has('state')) {
    try {
      await client.handleRedirectCallback();
    } catch (err) {
      error = err.error_description || err.message;
    }
  }
  if (params.has('error') || params.has('code')) {
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  const user = (await client.isAuthenticated()) ? await client.getUser() : null;
  return { enabled: true, user, error };
}

function requireClient() {
  if (!client) throw new Error('Auth0 is not set up yet: check the VITE_AUTH0_* values in .env');
  return client;
}

/** Go to the Auth0 login page (username + password). */
export const login = () => requireClient().loginWithRedirect();

/** Go straight to the Auth0 sign-up form. */
export const signup = () =>
  requireClient().loginWithRedirect({ authorizationParams: { screen_hint: 'signup' } });

export const logout = () =>
  client?.logout({ logoutParams: { returnTo: window.location.origin } });

/** Access token for our server, or null if not logged in. Used by src/api/. */
export async function getToken() {
  if (!client || !(await client.isAuthenticated())) return null;
  return client.getTokenSilently();
}
