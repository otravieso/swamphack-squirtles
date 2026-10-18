import React, { useEffect, useRef, useState } from 'react';
import TeacherRobot from './TeacherRobot.jsx';
import ClassroomBackdrop from './ClassroomBackdrop.jsx';
import { api } from '../api/api.js';
import { MAX_PDF_BYTES, isPdfFile, readAsBase64, titleFromFileName } from '../api/files.js';
import './dashboard.css';

// The notes dashboard: upload notes -> generate a game -> press play, or replay old notes.
//   user      the logged-in user (or null in guest mode)
//   canLogout show the Log out menu (false in guest mode)
//   onPlay    called with a full question set when the player presses play
//   onLogout  called when they choose Log out
const ACCEPT = '.pdf,application/pdf,.txt,.md,text/plain';

function formatSize(bytes = 0) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const iconProps = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
const UploadIcon = () => (
  <svg {...iconProps} width="44" height="44" strokeWidth="1.8"><path d="M12 16V4M7 9l5-5 5 5" /><path d="M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4" /></svg>
);
const DocIcon = () => (
  <svg {...iconProps}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5M9 13h6M9 17h6" /></svg>
);
const TrashIcon = () => (
  <svg {...iconProps} width="18" height="18"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12M9 7V4h6v3" /></svg>
);

function PlayButton({ ready, onClick }) {
  const ink = ready ? '#4A3A6B' : '#8F89A3';
  return (
    <button type="button" className={`db-play${ready ? ' is-ready' : ''}`} disabled={!ready} onClick={onClick}
      aria-label={ready ? 'Play game' : 'Play (generate a game first)'}>
      <svg viewBox="0 0 72 72" width="76" height="76" aria-hidden="true">
        <circle cx="36" cy="36" r="32" fill={ready ? '#F4A6B8' : '#C9C5D6'} stroke={ink} strokeWidth="4" />
        <circle cx="36" cy="36" r="25" fill="none" stroke={ready ? '#FBD3DC' : '#DDD9E8'} strokeWidth="2" strokeDasharray="3 4" />
        <path d="M30 24 L50 36 L30 48 Z" fill={ready ? '#FCEFF2' : '#A8A3B8'} stroke={ink} strokeWidth="3.5" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

export default function Dashboard({ user, canLogout = false, onPlay, onLogout }) {
  const [file, setFile] = useState(null); // { name, size, text? , pdf? }
  const [phase, setPhase] = useState('idle'); // idle | working | ready
  const [readySet, setReadySet] = useState(null);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [sets, setSets] = useState(null); // null = loading
  const [listError, setListError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [poked, setPoked] = useState(false); // mouse is over the robot -> glitchy face
  const inputRef = useRef(null);
  const menuRef = useRef(null);

  const name = user?.username || user?.nickname || user?.name || 'guest';
  const working = phase === 'working';
  const ready = phase === 'ready';

  useEffect(() => {
    let active = true;
    api.listQuestionSets()
      .then((list) => { if (active) setSets(list); })
      .catch((err) => {
        console.error('Could not load past games:', err); // the real cause shows in the browser console (F12)
        if (active) { setListError("Couldn't load your past games."); setSets([]); }
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onDown = (event) => { if (!menuRef.current?.contains(event.target)) setMenuOpen(false); };
    const onKey = (event) => { if (event.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  async function pick(picked) {
    if (!picked || working) return;
    setError('');
    setReadySet(null);
    setPhase('idle');
    const isPdf = isPdfFile(picked);
    if (!isPdf && !/\.(txt|md)$/i.test(picked.name) && picked.type !== 'text/plain') {
      setError('Use a PDF or a text file (.pdf, .txt).');
      return;
    }
    if (isPdf && picked.size > MAX_PDF_BYTES) {
      setError('That PDF is too large (max 15 MB).');
      return;
    }
    try {
      if (isPdf) {
        const data = await readAsBase64(picked);
        setFile({ name: picked.name, size: picked.size, pdf: { name: picked.name, mimeType: 'application/pdf', data } });
      } else {
        setFile({ name: picked.name, size: picked.size, text: await picked.text() });
      }
    } catch {
      setError("Couldn't read that file. Try another one.");
    }
  }

  async function generate() {
    if (!file || working) return;
    setPhase('working');
    setError('');
    setReadySet(null);
    try {
      const saved = await api.generateQuestions({
        title: titleFromFileName(file.name),
        notes: file.text ?? '',
        sourceFiles: file.text !== undefined ? [file.name] : [],
        file: file.pdf,
      });
      setReadySet(saved);
      setPhase('ready');
      setSets((list) => [
        { id: saved.id, title: saved.title, createdAt: saved.createdAt, questionCount: saved.questions.length },
        ...(list ?? []),
      ]);
    } catch (err) {
      const busy = /503|unavailable|high demand|busy|rate limit/i.test(err.message);
      setError(busy ? 'The Professor is busy right now. Wait a minute and try again.' : err.message);
      setPhase('idle');
    }
  }

  async function playAgain(id) {
    setBusyId(id);
    setListError('');
    try {
      onPlay?.(await api.getQuestionSet(id));
    } catch (err) {
      setListError(err.message);
      setBusyId(null);
    }
  }

  async function remove(id, title) {
    if (!window.confirm(`Delete "${title}"?`)) return;
    setBusyId(id);
    setListError('');
    try {
      await api.deleteQuestionSet(id);
      setSets((list) => list.filter((s) => s.id !== id));
    } catch (err) {
      setListError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  const note = error
    || (!file ? 'Add your notes to begin'
      : working ? 'This can take up to a minute.'
        : ready ? "Press play when you're ready." : 'Ready when you are.');

  return (
    <div className="db-page">
      <input ref={inputRef} type="file" accept={ACCEPT} hidden
        onChange={(e) => { pick(e.target.files[0]); e.target.value = ''; }} />

      <aside className="db-side">
        <section className="db-card">
          <h2>{ready ? 'YOUR NOTES' : 'UPLOAD YOUR NOTES'}</h2>

          {!file ? (
            <div className={`db-drop${dragging ? ' is-over' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { e.preventDefault(); setDragging(false); pick(e.dataTransfer.files[0]); }}>
              <UploadIcon />
              <p className="db-drop-title">Drag &amp; drop your notes here</p>
              <p className="db-drop-or">or</p>
              <button type="button" className="db-outline" onClick={() => inputRef.current?.click()}>Browse files</button>
              <p className="db-drop-hint">PDF or text file (.pdf, .txt)</p>
            </div>
          ) : (
            <div className="db-file">
              <div className="db-file-row">
                <DocIcon />
                <span className="db-file-name">{file.name}</span>
                <span className="db-file-size">{formatSize(file.size)}</span>
              </div>
              <div className="db-bar" role="progressbar" aria-label="Generating questions"
                aria-valuemin={0} aria-valuemax={100} aria-valuenow={ready ? 100 : working ? undefined : 0}>
                <div className={`db-bar-fill${working ? ' is-working' : ready ? ' is-done' : ''}`} />
              </div>
              <p className="db-file-status">
                {working ? 'Reading your notes…'
                  : ready ? `${readySet?.questions?.length ?? 0} questions ready`
                    : 'Ready to generate'}
                {!working && (
                  <> · <button type="button" className="db-link" onClick={() => inputRef.current?.click()}>Change file</button></>
                )}
              </p>
            </div>
          )}

          <button type="button" className={`db-generate${file && !working && !ready ? ' is-primary' : ''}`}
            disabled={!file || working} onClick={generate}>
            {working ? 'GENERATING…' : ready ? 'GENERATE AGAIN' : 'GENERATE GAME'}
          </button>
          <p className={`db-note${error ? ' is-error' : ''}`} role={error ? 'alert' : undefined}>{note}</p>
        </section>

        <section className="db-card">
          <h2>PREVIOUS NOTES</h2>
          {sets === null && <p className="db-empty">Loading…</p>}
          {sets?.length === 0 && !listError && <p className="db-empty">No past games yet.</p>}
          {sets?.length > 0 && (
            <ul className="db-sets">
              {sets.map((s) => (
                <li key={s.id}>
                  <DocIcon />
                  <span className="db-set-text">
                    <span className="db-set-title" title={s.title}>{s.title}</span>
                    <span className="db-set-date">{formatDate(s.createdAt)}</span>
                  </span>
                  <button type="button" className="db-outline is-small" disabled={busyId !== null} onClick={() => playAgain(s.id)}>
                    Play again
                  </button>
                  <button type="button" className="db-trash" disabled={busyId !== null}
                    onClick={() => remove(s.id, s.title)} aria-label={`Delete ${s.title}`} title="Delete">
                    <TrashIcon />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {listError && <p className="db-note is-error" role="alert">{listError}</p>}
          {sets?.length > 0 && <p className="db-kept">I kept every one.</p>}
        </section>
      </aside>

      <main className="db-stage">
        <ClassroomBackdrop />
        <div className="db-stage-top">
          <div className="db-board">Hand in your notes, I’ll do the rest.</div>
          <div className="db-pill-wrap" ref={menuRef}>
            <button type="button" className="db-pill" disabled={!canLogout}
              aria-haspopup={canLogout ? 'menu' : undefined} aria-expanded={canLogout ? menuOpen : undefined}
              onClick={() => setMenuOpen((open) => !open)}>
              <span className="db-avatar" aria-hidden="true">{name.charAt(0).toUpperCase()}</span>
              {name}
            </button>
            {menuOpen && (
              <div className="db-menu" role="menu">
                <button type="button" role="menuitem" onClick={onLogout}>Log out</button>
              </div>
            )}
          </div>
        </div>

        <div className="db-robot">
          <div onPointerEnter={() => setPoked(true)} onPointerLeave={() => setPoked(false)}>
            <TeacherRobot pose={working ? 'working' : 'waiting'} mood={error || poked ? 'glitch' : 'idle'} />
          </div>
        </div>

        <div className="db-floor">
          <PlayButton ready={ready} onClick={() => onPlay?.(readySet)} />
        </div>
      </main>
    </div>
  );
}