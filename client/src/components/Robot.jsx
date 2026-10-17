import React from 'react';

export default function Robot({ talking }) {
  return <div className={`bot${talking ? ' talk' : ''}`} aria-label="Robot professor" role="img">
    <div className="screen"><i className="eye"/><i className="eye"/><b className="mouth"/></div>
    <div className="pad"><u/><u/><u/></div>
  </div>;
}
