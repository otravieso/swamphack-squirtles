import React, { useEffect, useMemo, useState } from 'react';

const NAMES = { teacher: 'Professor', you: 'You', thought: 'You', narrator: '' };
function segments(text) {
  return String(text ?? '').split('*').map((value, i) => ({ value, glitch: i % 2 === 1 }));
}

export default function DialogueBox({ node, onAdvance, onTypingChange, waitingForChoice }) {
  const parts = useMemo(() => segments(node?.text), [node?.text]);
  const total = parts.reduce((sum, part) => sum + part.value.length, 0);
  const [visible, setVisible] = useState(0);
  useEffect(() => { setVisible(0); }, [node]);
  useEffect(() => {
    if (!node || visible >= total) return;
    const timer = window.setTimeout(() => setVisible(v => Math.min(total, v + 1)), 18);
    return () => window.clearTimeout(timer);
  }, [node, visible, total]);
  const typing = Boolean(node && visible < total);
  useEffect(() => { onTypingChange?.(typing); }, [typing, onTypingChange]);

  const handleClick = () => {
    if (!node || waitingForChoice) return;
    if (typing) setVisible(total);
    else onAdvance();
  };
  let remaining = visible;
  return <div className="box" data-who={node?.who ?? 'narrator'} onClick={handleClick}
    role="button" tabIndex={waitingForChoice ? -1 : 0}
    onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); handleClick(); } }}>
    <div className="name" hidden={!NAMES[node?.who]}>{NAMES[node?.who] ?? node?.who}</div>
    <p className="text">{parts.map((part, i) => {
      const amount = Math.max(0, Math.min(remaining, part.value.length));
      remaining -= amount;
      const content = part.value.slice(0, amount);
      return part.glitch ? <span className="glitch" key={i}>{content}</span> : <React.Fragment key={i}>{content}</React.Fragment>;
    })}</p>
    <span className="next" hidden={typing || waitingForChoice || !node}>▼</span>
  </div>;
}
