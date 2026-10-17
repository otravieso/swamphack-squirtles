// Auth0 challenge: "Sign in to attend class."
// If VITE_AUTH0_* values are blank, auth is disabled and everyone plays as guest.
import { createAuth0Client } from '@auth0/auth0-spa-js';

const domain = import.meta.env.VITE_AUTH0_DOMAIN;
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
const audience = import.meta.env.VITE_AUTH0_AUDIENCE;

export const authEnabled = Boolean(domain && clientId && audience);

let client = null;

export async function initAuth() {
  if (!authEnabled) return { enabled: false, user: null };

  client = await createAuth0Client({
    domain,
    clientId,
    cacheLocation: 'localstorage',
    authorizationParams: { redirect_uri: window.location.origin, audience },
  });

  // Coming back from the Auth0 login page
  const params = new URLSearchParams(window.location.search);
  if (params.has('code') && params.has('state')) {
    await client.handleRedirectCallback();
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  const user = (await client.isAuthenticated()) ? await client.getUser() : null;
  return { enabled: true, user };
}

export const login = () => client?.loginWithRedirect();

export const logout = () =>
  client?.logout({ logoutParams: { returnTo: window.location.origin } });

/** Access token for our API, or null when playing as guest. */
export async function getToken() {
  if (!client || !(await client.isAuthenticated())) return null;
  return client.getTokenSilently();
}
