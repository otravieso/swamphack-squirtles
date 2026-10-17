import React, { useState } from 'react';
import LoginRobot from './LoginRobot.jsx';
import { loginWithPassword, registerWithPassword } from '../auth/auth.js';
import { friendlyAuthError } from '../auth/authErrors.js';
import './login.css';

// Login / register screen. Calls onAuthed(user) once Auth0 accepts the login.
// Robot mood: login = idle, register = happy, failed attempt = glitch.
const LINES = {
  login: "Ready for another lesson? There's always more to learn!",
  register: "A new student! I'm so happy you're here!",
  busy: 'Checking your records…',
};

export default function LoginPage({ onAuthed }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [failed, setFailed] = useState(false);

  const registering = mode === 'register';
  const mood = failed ? 'glitch' : registering ? 'happy' : 'idle';

  function switchMode() {
    setMode(registering ? 'login' : 'register');
    setError('');
    setFailed(false);
  }

  function onEdit(setter) {
    return (event) => {
      setter(event.target.value);
      if (failed) setFailed(false); // robot calms down once they start fixing it
    };
  }

  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    if (!username.trim() || !password) {
      setError('Enter a username and password.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const user = registering
        ? await registerWithPassword(username.trim(), password)
        : await loginWithPassword(username.trim(), password);
      onAuthed(user);
    } catch (err) {
      setError(friendlyAuthError(err));
      setFailed(true);
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
            {failed ? (
              <>That doesn't <span className="lp-glitch">comp-comp-ute</span>… try again?</>
            ) : busy ? LINES.busy : LINES[mode]}
          </div>
          <LoginRobot mood={mood} />
        </div>

        <form className="lp-card" onSubmit={submit} noValidate>
          <h2>{registering ? 'REGISTER' : 'LOG IN'}</h2>

          <label htmlFor="lp-username">Username</label>
          <input id="lp-username" type="text" value={username} onChange={onEdit(setUsername)}
            placeholder="squirtle" autoComplete="username" autoCapitalize="none" spellCheck={false}
            maxLength={registering ? 15 : undefined} disabled={busy} />

          <label htmlFor="lp-password">Password</label>
          <input id="lp-password" type="password" value={password} onChange={onEdit(setPassword)}
            placeholder="Your password" disabled={busy}
            autoComplete={registering ? 'new-password' : 'current-password'} />

          <p className="lp-error" role="alert">{error}</p>

          <button type="submit" className="lp-submit" disabled={busy}>
            {busy ? 'PLEASE WAIT…' : registering ? 'REGISTER' : 'LOG IN'}
          </button>

          <p className="lp-switch">
            {registering ? 'Already a student? ' : 'New here? '}
            <button type="button" onClick={switchMode} disabled={busy}>
              {registering ? 'Log in here' : 'Register here'}
            </button>
          </p>
        </form>
      </div>
    </main>
  );
}