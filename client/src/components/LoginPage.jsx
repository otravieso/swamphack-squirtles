import React, { useState } from 'react';
import LoginRobot from './LoginRobot.jsx';
import { login } from '../auth/auth.js';
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
          <h2>WELCOME BACK</h2>
          <div className="lp-card-body">
            <p className="lp-lead">The classroom awaits!</p>
            <p className="lp-error" role="alert">{message}</p>
            <button type="button" className="lp-submit" disabled={busy} onClick={() => go(login)}>
              {busy ? 'PLEASE WAIT…' : 'LOG IN'}
            </button>
            <p className="lp-note">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="4" y="11" width="16" height="10" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
              </svg>
              <span>Secure sign-in with Auth0.</span>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}