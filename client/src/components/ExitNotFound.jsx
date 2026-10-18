import React from 'react';
import '../game/exit404.css';

// The "404 Exit Not Found…" screen the player bumps into at the library exit (end of story.js).
// Shown as its own scene by GameApp when the script reaches scene('404', ...).
// The REFRESH sign restarts the game once the script has finished (canRefresh).

// A simple gear: dashed thick stroke = teeth, inner circle = hole.
function Gear({ cx, cy, r, fill = '#c4c9c6', className = '' }) {
  const teeth = 8;
  const dash = (2 * Math.PI * r) / (teeth * 2);
  return <g className={`gear ${className}`} style={{ transformOrigin: `${cx}px ${cy}px` }}>
    <circle cx={cx} cy={cy} r={r} fill={fill} stroke={fill} strokeWidth={r * 0.55} strokeDasharray={`${dash} ${dash}`} />
    <circle cx={cx} cy={cy} r={r} fill="none" stroke="#2f2a3a" strokeWidth="2.5" />
    <circle cx={cx} cy={cy} r={r * 0.35} fill="#2f2a3a" />
  </g>;
}

const Nut = ({ x, y }) => <path className="e404-ink" d={`M${x - 7} ${y} l3.5 -6 h7 l3.5 6 l-3.5 6 h-7 Z`} fill="#c4c9c6" />;

function BrokenProfessor() {
  return <svg className="e404-bot" viewBox="0 0 520 460" role="img" aria-label="The Professor, broken into pieces">
    <ellipse cx="270" cy="404" rx="190" ry="16" fill="#3b2f2a22" />

    {/* Detached arm on the floor, holding a wrench */}
    <g className="e404-ink">
      <path d="M40 430 L92 404" stroke="#9aa09d" strokeWidth="9" strokeLinecap="round" />
      <path d="M30 436 a12 12 0 1 1 12 -14 l-8 4 l-2 6 Z" fill="#9aa09d" />
      <rect x="104" y="366" width="70" height="36" rx="16" fill="var(--e404-shell)" transform="rotate(-14 139 384)" />
      <circle cx="100" cy="398" r="16" fill="#3a3d3c" />
    </g>

    {/* Body with the chest panel ripped open */}
    <g className="e404-ink">
      <rect x="250" y="226" width="44" height="30" rx="6" fill="#3a3d3c" />
      <rect x="196" y="250" width="160" height="152" rx="24" fill="var(--e404-shell)" />
      <path d="M206 262 Q276 248 346 262" fill="none" stroke="#ffffff66" strokeWidth="5" strokeLinecap="round" />
      <circle cx="196" cy="300" r="16" fill="#3a3d3c" />
      <circle cx="356" cy="282" r="15" fill="#3a3d3c" />
      {/* loose tie */}
      <path d="M238 258 L256 262 L250 276 L234 272 Z" fill="#8b2b2b" />
      <path d="M234 272 L250 276 L226 344 L210 334 Z" fill="#8b2b2b" />
      {/* bent badge */}
      <rect x="214" y="300" width="22" height="20" rx="3" fill="#efe6c8" transform="rotate(20 225 310)" />
      <path d="M220 306 l10 5 l-10 4 Z" fill="#2f3a36" transform="rotate(20 225 310)" />
      {/* open compartment */}
      <rect x="262" y="290" width="78" height="70" rx="8" fill="#253029" />
      <circle cx="270" cy="298" r="2.5" fill="#6fae87" /><circle cx="332" cy="298" r="2.5" fill="#6fae87" />
    </g>
    <Gear cx={290} cy={320} r={15} className="spin" />
    <Gear cx={318} cy={340} r={9} fill="#d9b44a" className="spin-rev" />
    <path d="M282 360 q-6 18 -16 30" fill="none" stroke="#f2a7b5" strokeWidth="4" strokeLinecap="round" />
    <path d="M308 360 q4 14 -2 28" fill="none" stroke="#f0d36a" strokeWidth="4" strokeLinecap="round" />

    {/* Floating arm with a screwdriver */}
    <g className="e404-arm e404-ink">
      <rect x="360" y="226" width="34" height="58" rx="14" fill="var(--e404-shell)" transform="rotate(38 377 255)" />
      <circle cx="398" cy="218" r="15" fill="#3a3d3c" />
      <rect x="400" y="168" width="14" height="40" rx="5" fill="#e9a3ad" transform="rotate(18 407 188)" />
      <path d="M414 170 L432 106" stroke="#9aa09d" strokeWidth="4" strokeLinecap="round" />
    </g>

    {/* Sparks */}
    <path className="e404-spark" d="M366 296 l8 -8 l-2 8 l8 -6" fill="none" stroke="#f0d36a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <path className="e404-spark delay" d="M180 286 l-9 -5 l7 -3 l-8 -6" fill="none" stroke="#f0d36a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

    {/* Head: cracked screen, one eye out, wobbly mouth, a band-aid */}
    <g className="e404-head">
      <g transform="rotate(-10 255 130)" className="e404-ink">
        <rect x="118" y="40" width="236" height="190" rx="32" fill="var(--e404-side)" />
        <rect x="134" y="28" width="236" height="188" rx="32" fill="var(--e404-shell)" />
        <path d="M154 38 Q252 26 350 38" fill="none" stroke="#ffffff66" strokeWidth="6" strokeLinecap="round" />
        <rect x="158" y="52" width="188" height="130" rx="20" fill="#151a19" />
        <path d="M162 150 H342" stroke="#8a5f78" strokeWidth="3" />
        <rect x="196" y="86" width="22" height="46" rx="11" fill="#4f9e8c" className="e404-eye" />
        <path d="M264 106 H292" stroke="#8ff3df" strokeWidth="6" strokeLinecap="round" />
        <path d="M214 166 q10 -10 20 0 t20 0 t20 0" fill="none" stroke="#8ff3df" strokeWidth="5" strokeLinecap="round" />
        <path d="M304 54 L294 92 L310 102 L292 146" fill="none" stroke="#d9e2db" strokeWidth="2.5" strokeLinejoin="round" />
        <g transform="rotate(-30 160 44)">
          <rect x="134" y="34" width="56" height="20" rx="6" fill="#f1c7a2" />
          <circle cx="155" cy="44" r="1.6" fill="#b88c6a" /><circle cx="162" cy="44" r="1.6" fill="#b88c6a" /><circle cx="169" cy="44" r="1.6" fill="#b88c6a" />
        </g>
        <path d="M126 150 h10 M126 160 h10 M126 170 h10" stroke="#2f3a36" strokeWidth="3" strokeLinecap="round" />
        <circle cx="330" cy="200" r="3.5" fill="#6fae87" /><circle cx="342" cy="200" r="3.5" fill="#6fae87" />
        <circle cx="356" cy="60" r="5" fill="#7c9a63" /><circle cx="150" cy="198" r="4" fill="#7c9a63" />
      </g>
    </g>

    {/* Chest panel lying on the floor */}
    <g className="e404-ink">
      <ellipse cx="452" cy="396" rx="62" ry="24" fill="#24322c" transform="rotate(-12 452 396)" />
      <path d="M440 390 l14 -8 l-4 9 l14 -6" fill="none" stroke="#f0d36a" strokeWidth="3" strokeLinejoin="round" />
    </g>

    {/* Scattered parts */}
    <Gear cx={78} cy={444} r={10} />
    <Gear cx={186} cy={446} r={9} />
    <Gear cx={470} cy={444} r={10} />
    <Nut x={130} y={432} /><Nut x={396} y={446} />
    <path d="M240 446 q5 -8 10 0 t10 0 t10 0" fill="none" stroke="#9aa09d" strokeWidth="3" strokeLinecap="round" />
    <rect x="500" y="436" width="16" height="7" rx="2" fill="#c4c9c6" transform="rotate(25 508 440)" className="e404-ink" />
  </svg>;
}

export default function ExitNotFound({ canRefresh, refreshing, onRefresh }) {
  return <div className={`e404${refreshing ? ' is-refreshing' : ''}`}>
    <div className="e404-copy">
      <h1 className="e404-code" data-text="404:">404:</h1>
      <p className="e404-msg">Exit Not Found…</p>
    </div>
    <button type="button" className="e404-refresh" onClick={onRefresh} disabled={!canRefresh || refreshing}
      aria-label="Refresh (play again)">
      <span className="e404-plank" aria-hidden="true" />
      {refreshing ? 'REFRESHING…' : 'REFRESH'}
    </button>
    <div className="e404-floor" aria-hidden="true" />
    <BrokenProfessor />
  </div>;
}
