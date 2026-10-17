import React from 'react';
export default function ChoiceBox({ labels, onSelect }) {
  if (!labels?.length) return null;
  return <div className="choices" role="group" aria-label="Choose an answer">
    {labels.map((label, index) => <button type="button" key={index} onClick={() => onSelect(index)}>{label}</button>)}
  </div>;
}
