import React from 'react';

// Decoration behind the robot on the dashboard: a window with a beam of light and dust
// specks, and a bookshelf. Purely decorative (hidden from screen readers, ignores the mouse).
// Sizes and positions live in dashboard.css (.db-decor).
const INK = '#4A3A6B';

// Small seeded random generator so the books look the same on every render.
function rand(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const BOOK_COLORS = ['#A9D8C4', '#F4A6B8', '#B9B2E0', '#E8C45A', '#4C7A6A', '#8E2A44', '#9CC5E0'];
const SHELF_TOPS = [150, 235, 320, 405];

const BOOK_ROWS = SHELF_TOPS.map((top, row) => {
  const r = rand(11 + row);
  const books = [];
  const y = top + 8;
  let x = 744;
  while (x < 738 + 154 - 14) {
    const w = [10, 12, 14, 16][Math.floor(r() * 4)];
    const h = Math.floor(68 * 0.62 + r() * (68 - 4 - 68 * 0.62));
    books.push({ x, y: y + 68 - h, w, h, fill: BOOK_COLORS[Math.floor(r() * BOOK_COLORS.length)] });
    x += w + 1;
  }
  return books;
});

// Dust specks drifting up through the light (positions are in the beam's own 360x442 box).
const MOTES = Array.from({ length: 14 }, (_, i) => {
  const r = rand(40 + i);
  const t = i / 14;
  return {
    cx: 24 + t * 290 + (r() - 0.5) * 40,
    cy: 50 + t * 330 + (r() - 0.5) * 60,
    r: 1.4 + r() * 1.6,
    dur: 5 + r() * 4,
    delay: i * 0.45,
  };
});

export default function ClassroomBackdrop() {
  return (
    <div className="db-decor" aria-hidden="true">
      <div className="db-window">
        <svg className="db-window-art" viewBox="46 150 218 244">
          <rect x="60" y="150" width="190" height="230" fill="#D9A66E" stroke={INK} strokeWidth="4" />
          {[[72, 162], [160, 162], [72, 266], [160, 266]].map(([x, y]) => (
            <g key={`${x}-${y}`}>
              <rect x={x} y={y} width="78" height="100" fill="#CDE8EE" stroke={INK} strokeWidth="3" />
              <path d={`M${x + 10} ${y + 26} L${x + 30} ${y + 10}`} stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" opacity="0.8" />
            </g>
          ))}
          <rect x="46" y="380" width="218" height="14" rx="3" fill="#D9A66E" stroke={INK} strokeWidth="3" />
          <path d="M96 380 L102 352 L132 352 L138 380 Z" fill="#D98B6A" stroke="#8E4A3A" strokeWidth="3" strokeLinejoin="round" />
          {[[-35, -10], [0, 0], [35, 10]].map(([angle, dx]) => (
            <ellipse key={angle} cx={117 + dx} cy="334" rx="8" ry="20" transform={`rotate(${angle} ${117 + dx} 350)`}
              fill="#8FC27A" stroke="#5E8368" strokeWidth="2.5" />
          ))}
        </svg>

        <svg className="db-beam" viewBox="0 0 360 442">
          <polygon points="0,0 0,204 350,442 150,442" fill="#FFF3CF" opacity="0.32" />
          <polygon points="0,0 0,204 220,442 130,442" fill="#FFF8E0" opacity="0.22" />
          {MOTES.map((m, i) => (
            <circle key={i} className="db-mote" cx={m.cx} cy={m.cy} r={m.r} fill="#FFFDF0"
              style={{ animationDuration: `${m.dur}s`, animationDelay: `${m.delay}s` }} />
          ))}
        </svg>
      </div>

      <svg className="db-shelf" viewBox="726 150 178 328">
        <rect x="730" y="150" width="170" height="320" fill="#D9A66E" stroke={INK} strokeWidth="4" />
        {SHELF_TOPS.map((top, row) => (
          <g key={top}>
            <rect x="738" y={top + 8} width="154" height="68" fill="#F1D5B0" stroke={INK} strokeWidth="2" />
            {BOOK_ROWS[row].map((b, i) => (
              <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} fill={b.fill} stroke={INK} strokeWidth="2" />
            ))}
          </g>
        ))}
        <rect x="726" y="466" width="178" height="12" fill="#C98F5C" stroke={INK} strokeWidth="3" />
      </svg>
    </div>
  );
}