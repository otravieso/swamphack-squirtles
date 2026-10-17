import React from 'react';
export default function GameOver({ title, message, onRestart }) {
  if (!title) return null;
  return <div className="over" role="dialog" aria-modal="true" aria-label={title}>
    <h2>{title}</h2><p>{message}</p><button type="button" onClick={onRestart}>Play again</button>
  </div>;
}
