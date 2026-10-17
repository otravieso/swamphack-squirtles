import React from 'react';

// Professor Didactic: monitor-head robot with a sprout, collar, red tie and school badge.
// Looks are driven entirely by CSS (game.css), including the angrier faces at higher
// [data-aggro] levels and the red error screen at aggro 3.
export default function Robot({ talking }) {
  return <div className={`bot${talking ? ' talk' : ''}`} aria-label="Robot professor" role="img">
    <div className="sprout"><i /><i /></div>
    <div className="head">
      <div className="screen">
        <i className="eye" /><i className="eye" /><b className="mouth" />
        <span className="err">ERROR</span>
      </div>
    </div>
    <div className="torso">
      <span className="collar" />
      <span className="tie" />
      <span className="badge" />
      <span className="arm arm-l" />
      <span className="arm arm-r" />
    </div>
  </div>;
}
