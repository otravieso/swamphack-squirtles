import React, { useEffect, useState } from 'react';
import { api } from '../api/api.js';

// The player's saved question sets: play one again or delete it.
// Calls onPlay(fullSet) with the set and all its questions.
export default function SavedSets({ onPlay }) {
  const [sets, setSets] = useState(null); // null = loading
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let active = true;
    api.listQuestionSets()
      .then((list) => { if (active) setSets(list); })
      .catch((err) => { if (active) { setError(err.message); setSets([]); } });
    return () => { active = false; };
  }, []);

  async function play(id) {
    setBusyId(id);
    setError('');
    try {
      onPlay?.(await api.getQuestionSet(id));
    } catch (err) {
      setError(err.message);
      setBusyId(null);
    }
  }

  async function remove(id, title) {
    if (!window.confirm(`Delete "${title}"?`)) return;
    setBusyId(id);
    setError('');
    try {
      await api.deleteQuestionSet(id);
      setSets((list) => list.filter((s) => s.id !== id));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="card">
      <h2>Your saved notes</h2>
      {sets === null && <p className="status">Loading…</p>}
      {sets?.length === 0 && !error && <p className="status">Nothing saved yet. Hand in some notes!</p>}
      {sets?.length > 0 && (
        <ul className="sets">
          {sets.map((s) => (
            <li key={s.id}>
              <span>
                <strong>{s.title}</strong>
                <small> · {s.questionCount ?? '?'} questions</small>
              </span>
              <span>
                <button type="button" onClick={() => play(s.id)} disabled={busyId !== null}>Play</button>
                <button type="button" className="danger" onClick={() => remove(s.id, s.title)} disabled={busyId !== null}>Delete</button>
              </span>
            </li>
          ))}
        </ul>
      )}
      {error && <p className="error">Error: {error}</p>}
    </section>
  );
}
