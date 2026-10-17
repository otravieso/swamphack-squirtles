import './game.css';
import { Stats } from './stats.js';
import { story } from './story.js';
import { getQuestion } from './questionProvider.js';

// startGame(rootEl, { user, hooks, story })
// hooks (all optional, for login/AI teammates):
//   onAnswer({question, correct, choiceIndex}), onChoice({label, fx}),
//   onDeath({cause, stats}), onEnd({stats})
export function startGame(root, opts = {}) {
  const hooks = opts.hooks || {};
  const script = opts.story || story;
  const NAMES = { teacher: 'Professor', you: 'You', thought: 'You', narrator: '' };
  const DEATHS = {
    intelligence: 'Your mind goes quiet. The Professor smiles. "Lesson over."',
    health: 'Your body gives out. The Professor sighs. "Fragile things."',
    thirst: 'Your throat closes. The Professor hums. "Should have asked for water."',
    hunger: 'Your stomach finally stops asking. The Professor says, "Hm. Efficient."',
  };

  root.innerHTML = `<div class="vn" data-aggro="0"><div class="place"></div>
    <div class="bot"><div class="screen"><i class="eye"></i><i class="eye"></i><b class="mouth"></b></div>
    <div class="pad"><u></u><u></u><u></u></div></div>
    <div class="choices"></div>
    <div class="box" data-who="narrator"><div class="name"></div><p class="text"></p><span class="next">&#9660;</span></div>
    <div class="debug" hidden></div><div class="over" hidden></div></div>`;
  const $ = (s) => root.querySelector(s);
  const vn = $('.vn'), box = $('.box'), nameEl = $('.name'), textEl = $('.text'), nextEl = $('.next'),
    choicesEl = $('.choices'), overEl = $('.over'), dbg = $('.debug'), placeEl = $('.place'), bot = $('.bot');

  let stats, seen, tap = null, alive = true;
  class Dead extends Error {}
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const onTap = () => tap && tap();
  root.addEventListener('click', onTap);
  const onKey = (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onTap(); } };
  document.addEventListener('keydown', onKey);
  const waitTap = () => new Promise((r) => { tap = () => { tap = null; r(); }; });

  const parse = (s) => s.split('*').map((t, i) => ({ t, g: i % 2 === 1 })).filter((x) => x.t);
  const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const render = (segs, n) => segs.map((s) => {
    const p = esc(s.t.slice(0, Math.max(0, n))); n -= s.t.length;
    return s.g ? `<span class="glitch">${p}</span>` : p;
  }).join('');

  async function say(who, text, wait = true) {
    box.dataset.who = who; nameEl.textContent = NAMES[who]; nameEl.hidden = !NAMES[who];
    bot.classList.toggle('talk', who === 'teacher');
    const segs = parse(text), total = segs.reduce((a, s) => a + s.t.length, 0);
    let n = 0, skip = false; nextEl.hidden = true; tap = () => { skip = true; };
    while (n < total && !skip) { textEl.innerHTML = render(segs, ++n); await sleep(18); }
    textEl.innerHTML = render(segs, total); bot.classList.remove('talk');
    if (wait) { nextEl.hidden = false; await waitTap(); nextEl.hidden = true; } else tap = null;
  }

  const pick = (labels) => new Promise((res) => {
    choicesEl.innerHTML = '';
    labels.forEach((l, i) => {
      const b = document.createElement('button'); b.textContent = l;
      b.onclick = (e) => { e.stopPropagation(); choicesEl.innerHTML = ''; res(i); };
      choicesEl.append(b);
    });
  });

  const hit = (fx) => { stats.apply(fx); const d = stats.dead; if (d) throw new Dead(d); };

  async function play(nodes) {
    for (const n of nodes) {
      if (n.t === 'scene') { vn.dataset.aggro = Math.round(n.aggro * 3); placeEl.textContent = n.name; }
      else if (n.t === 'say') await say(n.who, n.text);
      else if (n.t === 'choice') {
        const i = await pick(n.options.map((o) => o.label)); const o = n.options[i];
        hooks.onChoice?.({ label: o.label, fx: o.fx });
        hit(o.fx); await play(o.then);
      } else if (n.t === 'q') {
        const aggro = Number(vn.dataset.aggro) / 3;
        const q = await getQuestion({ difficulty: aggro, seen });
        seen.push(q.id);
        await say('teacher', q.prompt, false);
        const i = await pick(q.choices), correct = i === q.correctIndex;
        hooks.onAnswer?.({ question: q, correct, choiceIndex: i });
        await play(correct ? n.right : n.wrong);
        if (!correct) {
          await say('narrator', `Correct answer: ${q.choices[q.correctIndex]}.${q.explanation ? ' ' + q.explanation : ''}`);
          hit({ intelligence: -1 });
        }
        stats.tick(); hit({});
      } else if (n.t === 'end') {
        await say('narrator', n.text, false); hooks.onEnd?.({ stats: stats.snapshot() }); await waitTap();
      }
    }
  }

  async function run() {
    stats = new Stats(); seen = []; overEl.hidden = true;
    const show = (s) => { dbg.textContent = Object.entries(s).map(([k, v]) => `${k}:${v}`).join('  '); };
    if (new URLSearchParams(location.search).has('debug')) { dbg.hidden = false; stats.onChange(show); show(stats.snapshot()); }
    try { await play(script); }
    catch (e) {
      if (!(e instanceof Dead)) throw e;
      hooks.onDeath?.({ cause: e.message, stats: stats.snapshot() });
      vn.dataset.aggro = 3; choicesEl.innerHTML = '';
      overEl.innerHTML = `<h2>You died</h2><p>${DEATHS[e.message]}</p><button>Try again</button>`;
      overEl.hidden = false;
      await new Promise((r) => { overEl.querySelector('button').onclick = r; });
      if (alive) return run();
    }
  }
  run();
  return { stats: () => stats.snapshot(), destroy() { alive = false; document.removeEventListener('keydown', onKey); root.innerHTML = ''; } };
}
