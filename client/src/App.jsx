import React, { useEffect, useRef, useState } from 'react';
import { authEnabled, initAuth, logout } from './auth/auth.js';
import { loadQuestionSetIntoGame, queueQuestionSetForNextRun } from './game/questionSetAdapter.js';
import { api } from './api/api.js';
import LoginPage from './components/LoginPage.jsx';
import Dashboard from './components/Dashboard.jsx';
import GameApp from './GameApp.jsx';
import './screens.css';

// Run Auth0 setup exactly once per page load (it also finishes a login redirect).
const authReady = initAuth().catch((err) => ({ user: null, error: err.message }));

// What the corner note says while "Play again" questions are being made.
const REGEN_STATUS = {
  working: 'Writing new questions for your next run…',
  ready: 'New questions ready: press Play again',
  failed: "Couldn't make new questions, so Play again reuses these",
};

// Screens:  loading -> (login) -> home [upload + saved sets] -> game
export default function App() {
  const [auth, setAuth] = useState({ loading: true, user: null, error: null });
  const [questionSet, setQuestionSet] = useState(null);
  const [regen, setRegen] = useState(''); // '' | 'working' | 'ready' | 'failed'
  const playing = useRef(null); // the set being played (newest version)
  const regenBusy = useRef(false);

  useEffect(() => {
    authReady.then(({ user, error }) => setAuth({ loading: false, user, error: error ?? null }));
  }, []);

  function play(set) {
    loadQuestionSetIntoGame(set); // the game will now ask this set's questions
    playing.current = set;
    setRegen('');
    setQuestionSet(set);
  }

  function leaveGame() {
    playing.current = null;
    setRegen('');
    setQuestionSet(null);
  }

  // When a run ends (finished or died), Gemini writes a fresh round from the saved notes
  // while the player reads the end screen. The new questions replace the old ones on the
  // server and are used from the next run's first question.
  async function regenerateForNextRun() {
    const set = playing.current;
    if (!set || set.hasNotes === false || regenBusy.current) return;
    regenBusy.current = true;
    setRegen('working');
    try {
      const fresh = await api.regenerateQuestionSet(set.id);
      if (playing.current?.id !== set.id) return; // player left this set meanwhile
      queueQuestionSetForNextRun(fresh);
      playing.current = fresh;
      setRegen('ready');
    } catch (err) {
      console.warn('Could not regenerate questions:', err.message);
      if (playing.current?.id === set.id) setRegen('failed');
    } finally {
      regenBusy.current = false;
    }
  }

  // Hide the "ready"/"failed" note once the next run is under way.
  const clearRegenNote = () => setRegen((r) => (r === 'working' ? r : ''));

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
            onEnd: regenerateForNextRun,
            onDeath: regenerateForNextRun,
            onChoice: clearRegenNote,
            onAnswer: clearRegenNote,
          }}
        />
        <button type="button" className="back" onClick={leaveGame}>← My notes</button>
        {regen && <p className={`regen regen-${regen}`} role="status">{REGEN_STATUS[regen]}</p>}
      </>
    );
  }

  // Home: upload notes, pick a saved set, press play
  return <Dashboard user={auth.user} canLogout={authEnabled} onLogout={() => logout()} onPlay={play} />;
}