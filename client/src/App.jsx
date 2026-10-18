import React, { useEffect, useRef, useState } from 'react';
import { authEnabled, initAuth, logout } from './auth/auth.js';
import { loadQuestionSetIntoGame } from './game/questionSetAdapter.js';
import { api } from './api/api.js';
import LoginPage from './components/LoginPage.jsx';
import Dashboard from './components/Dashboard.jsx';
import GameApp from './GameApp.jsx';
import './screens.css';

// Run Auth0 setup exactly once per page load (it also finishes a login redirect).
const authReady = initAuth().catch((err) => ({ user: null, error: err.message }));

// Longest we wait for new questions after Play again before replaying the old ones.
const REGEN_TIMEOUT_MS = 60_000;

// Screens:  loading -> (login) -> dashboard [upload + saved sets] -> game
export default function App() {
  const [auth, setAuth] = useState({ loading: true, user: null, error: null });
  const [questionSet, setQuestionSet] = useState(null);
  const [regen, setRegen] = useState(null); // null | { kind: 'working' | 'failed', text }
  const playing = useRef(null); // the set being played (newest version)

  useEffect(() => {
    authReady.then(({ user, error }) => setAuth({ loading: false, user, error: error ?? null }));
  }, []);

  function play(set) {
    loadQuestionSetIntoGame(set); // the game will now ask this set's questions
    playing.current = set;
    setRegen(null);
    setQuestionSet(set);
  }

  function leaveGame() {
    playing.current = null;
    setRegen(null);
    setQuestionSet(null);
  }

  // "Play again" was clicked: Gemini writes a fresh round from the notes saved with this set
  // (one request, only when the player actually replays). The new questions replace the old
  // ones on the server and in the game. If that fails, the run restarts with the old questions.
  async function regenerateBeforeReplay() {
    const set = playing.current;
    if (!set || set.hasNotes === false) return; // nothing to regenerate from: replay as-is
    setRegen({ kind: 'working', text: 'Writing new questions…' });
    try {
      const fresh = await Promise.race([
        api.regenerateQuestionSet(set.id),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Gemini took too long.')), REGEN_TIMEOUT_MS)),
      ]);
      if (playing.current?.id !== set.id) return; // player left this set meanwhile
      loadQuestionSetIntoGame(fresh);
      playing.current = fresh;
      setRegen(null);
    } catch (err) {
      console.warn('Could not regenerate questions:', err.message);
      if (playing.current?.id === set.id) {
        setRegen({ kind: 'failed', text: `Couldn't make new questions, so this run reuses the last ones. ${err.message}` });
      }
    }
  }

  // Hide the "failed" note once the player makes their first move in the new run.
  const clearRegenNote = () => setRegen((r) => (r?.kind === 'failed' ? null : r));

  if (auth.loading) {
    return <div className="page"><p className="status">Loading…</p></div>;
  }

  // Logged out (skipped entirely when Auth0 isn't configured)
  if (authEnabled && !auth.user) {
    return <LoginPage error={auth.error} />;
  }

  // Playing
  if (questionSet) {
    return (
      <>
        <GameApp
          key={questionSet.id}
          hooks={{
            onRestart: regenerateBeforeReplay,
            onChoice: clearRegenNote,
            onAnswer: clearRegenNote,
          }}
        />
        <button type="button" className="back" onClick={leaveGame}>← My notes</button>
        {regen && <p className={`regen regen-${regen.kind}`} role="status">{regen.text}</p>}
      </>
    );
  }

  // Home: upload notes, pick a saved set, press play
  return <Dashboard user={auth.user} canLogout={authEnabled} onLogout={() => logout()} onPlay={play} />;
}