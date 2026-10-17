import React from 'react';

// 2D robot teacher for the login / register screen.
// mood: 'idle' (login), 'happy' (register), 'glitch' (failed login)
// Colors are inline on purpose so a teammate's robot can replace this file without touching CSS.
const MINT = '#7FE8D0';

function Face({ mood }) {
  if (mood === 'happy') {
    return (
      <g className="lp-face">
        <path d="M110 122 Q120 98 130 122" fill="none" stroke={MINT} strokeWidth="7" strokeLinecap="round" />
        <path d="M190 122 Q200 98 210 122" fill="none" stroke={MINT} strokeWidth="7" strokeLinecap="round" />
        <path d="M132 142 Q160 176 188 142" fill="none" stroke={MINT} strokeWidth="7" strokeLinecap="round" />
      </g>
    );
  }
  if (mood === 'glitch') {
    return (
      <g className="lp-face lp-face-glitch">
        <rect x="112" y="102" width="16" height="26" rx="8" fill={MINT} />
        <rect x="186" y="86" width="16" height="44" rx="8" fill={MINT} />
        <rect x="80" y="112" width="160" height="5" fill={MINT} opacity="0.55" />
        <rect x="96" y="150" width="90" height="4" fill={MINT} opacity="0.4" />
        <path d="M138 152 L148 144 L158 154 L168 144 L182 152" fill="none" stroke={MINT} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    );
  }
  return (
    <g className="lp-face">
      <rect x="112" y="92" width="16" height="42" rx="8" fill={MINT} />
      <rect x="192" y="92" width="16" height="42" rx="8" fill={MINT} />
      <rect x="116" y="98" width="4" height="10" rx="2" fill="#E6FFF8" opacity="0.8" />
      <rect x="196" y="98" width="4" height="10" rx="2" fill="#E6FFF8" opacity="0.8" />
      <path d="M138 146 Q160 164 182 146" fill="none" stroke={MINT} strokeWidth="7" strokeLinecap="round" />
    </g>
  );
}

export default function LoginRobot({ mood = 'idle' }) {
  return (
    <svg className={`lp-robot lp-robot-${mood}`} viewBox="0 0 320 380" role="img"
      aria-label={`Robot teacher, ${mood === 'glitch' ? 'glitching' : mood === 'happy' ? 'happy' : 'smiling'}`}>
      <ellipse cx="160" cy="352" rx="72" ry="10" fill="#E3F1E4" opacity="0.8" />
      <g className="lp-bob">
        <path d="M104 240 L92 262" fill="none" stroke="#3E4450" strokeWidth="20" strokeLinecap="round" />
        <path d="M216 240 L240 230" fill="none" stroke="#3E4450" strokeWidth="20" strokeLinecap="round" />
        <g transform="rotate(-6 66 326)">
          <rect x="42" y="294" width="48" height="64" rx="4" fill="#FFFCF2" stroke="#5E5470" strokeWidth="3" />
          <line x1="50" y1="308" x2="80" y2="308" stroke="#B9B2C6" strokeWidth="3" />
          <line x1="50" y1="317" x2="80" y2="317" stroke="#B9B2C6" strokeWidth="3" />
          <line x1="50" y1="326" x2="72" y2="326" stroke="#B9B2C6" strokeWidth="3" />
          <circle cx="68" cy="344" r="7" fill="none" stroke="#D96B6B" strokeWidth="2" />
          <path d="M65 344 Q68 348 71 344" fill="none" stroke="#D96B6B" strokeWidth="2" />
        </g>
        <path d="M92 262 L86 292" fill="none" stroke="#5E8368" strokeWidth="26" strokeLinecap="round" />
        <path d="M92 262 L86 292" fill="none" stroke="#A9CDA2" strokeWidth="18" strokeLinecap="round" />
        <path d="M240 230 L266 200" fill="none" stroke="#5E8368" strokeWidth="26" strokeLinecap="round" />
        <path d="M240 230 L266 200" fill="none" stroke="#A9CDA2" strokeWidth="18" strokeLinecap="round" />
        <g transform="translate(262 214) rotate(20)">
          <rect x="-7" y="-10" width="14" height="10" rx="3" fill="#E58FA3" stroke="#8E4A5C" strokeWidth="2.5" />
          <rect x="-7" y="-19" width="14" height="9" fill="#C9CDD6" stroke="#6B6F7A" strokeWidth="2.5" />
          <line x1="-7" y1="-16" x2="7" y2="-16" stroke="#8E93A0" strokeWidth="1.5" />
          <line x1="-7" y1="-13" x2="7" y2="-13" stroke="#8E93A0" strokeWidth="1.5" />
          <rect x="-7" y="-74" width="14" height="55" fill="#E8C45A" />
          <rect x="-7" y="-74" width="5" height="55" fill="#F3D77E" />
          <rect x="3" y="-74" width="4" height="55" fill="#D2A93C" />
          <rect x="-7" y="-74" width="14" height="55" fill="none" stroke="#8A6A2E" strokeWidth="2.5" />
          <polygon points="-7,-74 7,-74 0,-98" fill="#F2DDB0" stroke="#8A6A2E" strokeWidth="2.5" strokeLinejoin="round" />
          <polygon points="-2.3,-90 2.3,-90 0,-98" fill="#4A4358" />
        </g>
        <circle cx="85" cy="300" r="12" fill="#3E4450" />
        <circle cx="271" cy="194" r="12" fill="#3E4450" />
        <ellipse cx="160" cy="320" rx="54" ry="11" fill={MINT} stroke="#4C6A57" strokeWidth="3" />
        <rect x="108" y="210" width="104" height="110" rx="22" fill="#A9CDA2" stroke="#5E8368" strokeWidth="4" />
        <rect x="120" y="224" width="80" height="78" rx="14" fill="#BBD8B2" />
        <path d="M120 308 Q160 326 200 308" fill="none" stroke="#A9CDA2" strokeWidth="10" />
        <circle cx="116" cy="238" r="4" fill="#6FA35C" />
        <circle cx="204" cy="304" r="4" fill="#6FA35C" />
        <polygon points="150,212 170,212 166,226 154,226" fill="#8E2A44" stroke="#4A1D2B" strokeWidth="3" strokeLinejoin="round" />
        <polygon points="154,226 166,226 176,280 160,298 144,280" fill="#8E2A44" stroke="#4A1D2B" strokeWidth="3" strokeLinejoin="round" />
        <line x1="154" y1="248" x2="164" y2="254" stroke="#5E1B2A" strokeWidth="3" />
        <line x1="151" y1="266" x2="168" y2="274" stroke="#5E1B2A" strokeWidth="3" />
        <rect x="176" y="240" width="26" height="20" rx="4" fill="#F1E6C4" stroke="#4A3F2B" strokeWidth="3" />
        <polygon points="189,244 199,249 189,254 179,249" fill="#3A3A3A" />
        <rect x="142" y="196" width="36" height="16" rx="4" fill="#3E4450" />
        <circle cx="104" cy="238" r="15" fill="#3E4450" />
        <circle cx="216" cy="238" r="15" fill="#3E4450" />
        <g transform="rotate(-4 160 114)">
          <rect x="52" y="30" width="216" height="168" rx="28" fill="#A9CDA2" stroke="#5E8368" strokeWidth="4" />
          <path d="M68 76 Q68 48 98 44" fill="none" stroke="#DCEFD5" strokeWidth="6" strokeLinecap="round" />
          <rect x="68" y="48" width="184" height="136" rx="18" fill="#BBD8B2" />
          <rect x="74" y="56" width="172" height="120" rx="14" fill="#172623" stroke="#3E4450" strokeWidth="3" />
          <path d="M88 74 L130 66" fill="none" stroke="#2E4640" strokeWidth="4" strokeLinecap="round" />
          <Face mood={mood} />
          <circle cx="216" cy="192" r="2.5" fill={MINT} />
          <circle cx="226" cy="192" r="2.5" fill={MINT} />
          <circle cx="236" cy="192" r="2.5" fill="#6FA35C" />
          <line x1="56" y1="140" x2="64" y2="140" stroke="#4C6A57" strokeWidth="3" />
          <line x1="56" y1="148" x2="64" y2="148" stroke="#4C6A57" strokeWidth="3" />
          <line x1="56" y1="156" x2="64" y2="156" stroke="#4C6A57" strokeWidth="3" />
          <circle cx="60" cy="108" r="5" fill="#6FA35C" />
          <circle cx="70" cy="190" r="4" fill="#6FA35C" />
          <path d="M232 30 Q232 16 238 8" fill="none" stroke="#5E8368" strokeWidth="3" strokeLinecap="round" />
          <ellipse cx="244" cy="8" rx="10" ry="5" transform="rotate(-25 244 8)" fill="#8FC27A" stroke="#5E8368" strokeWidth="2" />
          <ellipse cx="228" cy="14" rx="8" ry="4" transform="rotate(25 228 14)" fill="#8FC27A" stroke="#5E8368" strokeWidth="2" />
        </g>
      </g>
    </svg>
  );
}