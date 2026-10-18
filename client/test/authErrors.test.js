import test from 'node:test';
import assert from 'node:assert/strict';
import { friendlyAuthError } from '../src/auth/authErrors.js';

test('wrong password', () => {
  assert.match(friendlyAuthError({ code: 'invalid_grant' }), /isn't right/);
});
test('taken username on sign-up', () => {
  assert.match(friendlyAuthError({ code: 'invalid_signup' }), /taken/);
});
test('weak password', () => {
  assert.match(friendlyAuthError({ code: 'invalid_password' }), /too weak/);
});
test('network failure', () => {
  assert.match(friendlyAuthError(new TypeError('Failed to fetch')), /Can't reach/);
});
test('unknown error falls back', () => {
  assert.match(friendlyAuthError({}), /Something went wrong/);
});