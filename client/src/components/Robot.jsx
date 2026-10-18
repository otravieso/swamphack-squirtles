import React from 'react';

// Professor Didactic, drawn as an SVG to match the game art: a tilted monitor head with a
// sprout, glowing cyan face, collared shirt, red tie, cap badge, pencil and graded paper.
// Colors and moods come from game.css (--glow, --shell, [data-aggro] faces, red ERROR screen).
export default function Robot({ talking }) {
  return <div className={`bot${talking ? ' talk' : ''}`} aria-label="Robot professor" role="img">
    <svg viewBox="40 20 400 450" xmlns="http://www.w3.org/2000/svg">
      {/* Arm holding the paper (left side) */}
      <g className="arm-down">
        <path d="M140 318 L110 372 L126 382" className="limb" />
        <path d="M140 318 L122 350" className="sleeve-edge" /><path d="M140 318 L122 350" className="sleeve" />
        <g transform="rotate(-12 104 384)">
          <rect x="68" y="350" width="64" height="82" rx="5" className="paper" />
          <path d="M80 366h40M80 378h42M80 390h30" className="paper-line" />
          <circle cx="112" cy="412" r="9" className="paper-mark" />
          <path d="M108 411q4 5 8 0" className="paper-mark-smile" />
        </g>
        <circle cx="128" cy="380" r="17" className="hand" />
      </g>

      {/* Body */}
      <rect x="196" y="268" width="40" height="26" rx="6" className="limb-fill" />
      <path d="M140 300 Q140 284 160 282 L272 282 Q292 284 292 300 L300 470 L132 470 Z" className="shell" />
      <path d="M150 292 Q216 276 282 292" className="shell-shine" />
      <path d="M216 290 L176 284 L190 324 Z" className="collar" />
      <path d="M216 290 L256 284 L242 324 Z" className="collar" />
      <path d="M206 292 L226 292 L230 310 L202 310 Z" className="tie" />
      <path d="M202 310 L230 310 L240 400 L216 426 L192 400 Z" className="tie" />
      <rect x="250" y="336" width="32" height="28" rx="4" className="badge" />
      <path d="M266 343 l11 5 l-11 5 l-11 -5 Z M260 351 v5 q6 4 12 0 v-5" className="badge-icon" />
      <circle cx="170" cy="380" r="4" className="rust" />
      <circle cx="262" cy="410" r="3" className="rust" />

      {/* Arm holding the pencil (right side) — waves while talking */}
      <g className="arm-up">
        <path d="M292 318 L364 304 L390 244" className="limb" />
        <path d="M292 318 L340 309" className="sleeve-edge" /><path d="M292 318 L340 309" className="sleeve" />
        <g transform="rotate(16 398 196)">
          <rect x="389" y="152" width="18" height="74" rx="3" className="pencil" />
          <rect x="389" y="144" width="18" height="12" rx="3" className="eraser" />
          <path d="M389 226 L407 226 L398 246 Z" className="pencil-tip" />
          <path d="M395 238 L401 238 L398 246 Z" className="pencil-lead" />
        </g>
        <circle cx="392" cy="238" r="18" className="hand" />
      </g>

      {/* Head */}
      <g className="head">
        <g transform="translate(216 262) scale(.82) translate(-216 -262) rotate(-7 210 150)">
          <rect x="70" y="40" width="276" height="216" rx="46" className="shell-side" />
          <rect x="92" y="30" width="268" height="214" rx="44" className="shell" />
          <path d="M118 40 Q226 26 334 40" className="shell-shine" />
          <rect x="116" y="54" width="220" height="164" rx="30" className="screen" />
          <rect x="166" y="98" width="24" height="48" rx="12" className="eye" />
          <rect x="262" y="98" width="24" height="48" rx="12" className="eye" />
          <path d="M190 170 Q226 198 262 170" className="mouth mouth-smile" />
          <path d="M196 178 L256 178" className="mouth mouth-flat" />
          <path d="M186 178 L266 178" className="mouth mouth-glitch" />
          <text x="226" y="206" textAnchor="middle" className="err">ERROR</text>
          <circle cx="310" cy="232" r="4" className="led" />
          <circle cx="324" cy="232" r="4" className="led" />
          <circle cx="112" cy="230" r="5" className="rust" />
          <circle cx="340" cy="70" r="4" className="rust" />
          {/* Sprout */}
          <path d="M318 32 Q320 14 328 2" className="stem" />
          <path d="M327 6 Q312 -6 302 6 Q314 16 327 6 Z" className="leaf" />
          <path d="M328 4 Q338 -12 352 -4 Q344 10 328 4 Z" className="leaf" />
        </g>
      </g>
    </svg>
  </div>;
}
