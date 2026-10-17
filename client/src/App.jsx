import React, { useEffect, useState } from 'react';
import { authEnabled, initAuth, login, logout, signup } from './auth/auth.js';
import { loadQuestionSetIntoGame } from './game/questionSetAdapter.js';
import UploadNotes from './components/UploadNotes.jsx';
import SavedSets from './components/SavedSets.jsx';
import GameApp from './GameApp.jsx';
import './screens.css';

// Run Auth0 setup exactly once per page load (it also finishes a login redirect).
const authReady = initAuth().catch((err) => ({ user: null, error: err.message }));

// Screens:  loading -> (login) -> home [upload + saved sets] -> game
export default function App() {
  const [auth, setAuth] = useState({ loading: true, user: null, error: null });
  const [questionSet, setQuestionSet] = useState(null);

  useEffect(() => {
    authReady.then(({ user, error }) => setAuth({ loading: false, user, error: error ?? null }));
  }, []);

  function play(set) {
    loadQuestionSetIntoGame(set); // the game will now ask this set's questions
    setQuestionSet(set);
  }

  if (auth.loading) {
    return <div className="page"><p className="status">Loading…</p></div>;
  }

  // Logged out (skipped entirely when Auth0 isn't configured)
  if (authEnabled && !auth.user) {
    return (
      <div className="page">
        <div className="card center">
          <h1>SwampHack Squirtles</h1>
          <p>Learning has never been this fun! ★</p>
          {auth.error && <p className="error">{auth.error}</p>}
          <button type="button" className="primary" onClick={() => signup()}>Sign up</button>
          <button type="button" onClick={() => login()}>Log in</button>
        </div>
      </div>
    );
  }

  // Playing
  if (questionSet) {
    return (
      <>
        <GameApp key={questionSet.id} />
        <button type="button" className="back" onClick={() => setQuestionSet(null)}>← My notes</button>
      </>
    );
  }

  // Home: upload new notes or pick a saved set
  return (
    <div className="page">
      {authEnabled && (
        <p className="userbar">
          {auth.user.username || auth.user.nickname || auth.user.name}
          <button type="button" onClick={() => logout()}>Log out</button>
        </p>
      )}
      <UploadNotes onGenerated={play} />
      <SavedSets onPlay={play} />
    </div>
  );
}
