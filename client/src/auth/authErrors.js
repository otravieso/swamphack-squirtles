// Turns whatever Auth0 sends back into one short, friendly sentence for the login page.
// Pure function (no browser APIs) so it can be unit-tested with `npm test`.
//
// Auth0 error shapes we handle:
//   /oauth/token        -> { error: 'invalid_grant', error_description: 'Wrong email or password.' }
//   /dbconnections/signup -> { code: 'invalid_signup' | 'invalid_password', description, message }
export function friendlyAuthError(err) {
  if (err instanceof TypeError) return "Can't reach the login server. Check your connection and try again.";

  const code = err?.code || err?.error || '';
  switch (code) {
    case 'invalid_grant':
    case 'wrong_username_or_password':
      return "That username or password isn't right.";
    case 'too_many_attempts':
      return 'Too many tries. Wait a minute, then try again.';
    case 'unauthorized_client':
      return "Login isn't switched on in Auth0 yet. Enable the Password grant (see client/src/auth/README.md).";
    case 'invalid_password':
      return 'That password is too weak. Try a longer one with a mix of letters and numbers.';
    case 'invalid_signup':
    case 'username_exists':
    case 'user_exists':
      return 'That username is taken or not allowed. Use 1-15 letters, numbers, or _ . -';
    case 'password_leaked':
      return 'That password showed up in a data breach. Pick a different one.';
    case 'access_denied':
      return typeof err?.description === 'string' && err.description ? err.description : 'Access denied.';
    default:
      return 'Something went wrong. Try again.';
  }
}