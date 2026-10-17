import React, { useState } from 'react';
import LoginRobot from './LoginRobot.jsx';
import { login, signup } from '../auth/auth.js';
import './login.css';

// Login screen. The button sends the player to Auth0's hosted page (username + password
// there), and Auth0 sends them back here already logged in.
// `error` = a message from App.jsx if Auth0 sent back an error.
// Robot mood: normal = idle, something went wrong = glitch.
export default function LoginPage({ error }) {
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState('');

  const message = problem || error || '';
  const failed = Boolean(message);

  async function go(action) {
    setBusy(true);
    setProblem('');
    try {
      await action(); // redirects away to Auth0
    } catch (err) {
      setProblem(err?.message || 'Could not reach the login page. Try again.');
      setBusy(false);
    }
  }

  return (
    <main className="lp-page">
      <header className="lp-head">
        <h1>404: Exit Not Found</h1>
        <p>Study smarter. Escape sooner. Maybe.</p>
      </header>

      <div className="lp-row">
        <div className="lp-bot">
          <div className="lp-bubble" aria-live="polite">
            <p className="lp-say">
              {failed ? (
                <>That doesn't <span className="lp-glitch">comp-comp-ute</span>… try again?</>
              ) : busy ? 'Opening the door…' : "Ready for another lesson? There's always more to learn!"}
            </p>
          </div>
          <LoginRobot mood={failed ? 'glitch' : 'idle'} />
        </div>

        <div className="lp-card">
          <p className="lp-error" role="alert">{message}</p>
          <button type="button" className="lp-submit" disabled={busy} onClick={() => go(login)}>
            {busy ? 'PLEASE WAIT…' : 'LOG IN'}
          </button>
          <p className="lp-note">You'll sign in on a secure Auth0 page.</p>
          <p className="lp-switch">
            New here?{' '}
            <button type="button" disabled={busy} onClick={() => go(signup)}>Register here</button>
          </p>
        </div>
      </div>
    </main>
  );
}