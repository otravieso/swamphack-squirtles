import React, { useState } from 'react';
import { api } from '../api/api.js';
import { MAX_PDF_BYTES, isPdfFile, readAsBase64, titleFromFileName } from '../api/files.js';

// Upload notes (pasted text, .txt/.md, or PDF) -> Gemini -> saved question set.
// Calls onGenerated(savedSet) when the set has been saved.
export default function UploadNotes({ onGenerated }) {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [pdf, setPdf] = useState(null); // { name, mimeType, data(base64) }
  const [textFileName, setTextFileName] = useState(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleFile(event) {
    const file = event.target.files[0];
    setPdf(null);
    setTextFileName(null);
    setError('');
    setStatus('');
    if (!file) return;
    if (!title) setTitle(titleFromFileName(file.name));

    try {
      if (isPdfFile(file)) {
        if (file.size > MAX_PDF_BYTES) {
          event.target.value = '';
          setError('That PDF is too large (max 15 MB).');
          return;
        }
        setPdf({ name: file.name, mimeType: 'application/pdf', data: await readAsBase64(file) });
        setStatus(`PDF ready: ${file.name}`);
      } else {
        setNotes(await file.text()); // .txt / .md go into the text box so they can be edited
        setTextFileName(file.name);
      }
    } catch {
      setError("Couldn't read that file. Try another one.");
    }
  }

  async function handleGenerate(event) {
    event.preventDefault();
    if (!notes.trim() && !pdf) {
      setError('Paste some notes or choose a file first.');
      return;
    }
    setBusy(true);
    setError('');
    setStatus(pdf
      ? 'The Professor is reading your PDF and writing questions… (15–60 seconds)'
      : 'The Professor is writing your questions… (5–20 seconds)');
    try {
      const saved = await api.generateQuestions({
        title,
        notes,
        sourceFiles: textFileName ? [textFileName] : [],
        file: pdf ?? undefined,
      });
      setStatus(`Saved "${saved.title}" with ${saved.questions.length} questions.`);
      onGenerated?.(saved);
    } catch (err) {
      setError(err.message);
      setStatus('');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card" onSubmit={handleGenerate}>
      <h2>Hand in your notes</h2>
      <label className="field">
        Title
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Bio Chapter 3" disabled={busy} />
      </label>
      <label className="field">
        PDF, .txt or .md file
        <input type="file" accept=".pdf,application/pdf,.txt,.md,text/plain" onChange={handleFile} disabled={busy} />
      </label>
      <label className="field">
        …or paste your notes
        <textarea rows={8} value={notes} onChange={(e) => setNotes(e.target.value)} disabled={busy} />
      </label>
      <button type="submit" className="primary" disabled={busy}>
        {busy ? 'Working…' : 'Generate questions & play'}
      </button>
      {status && <p className="status">{status}</p>}
      {error && <p className="error">Error: {error}</p>}
    </form>
  );
}
