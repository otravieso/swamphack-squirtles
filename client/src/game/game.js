import './game.css';
import { Stats } from './stats.js';
import { story as defaultStory } from './story.js';
import { getQuestion } from './questionProvider.js';

export function startGame(root, opts = {}) {
  if (!root) throw new Error('startGame requires a root element');
  const hooks = opts.hooks ?? {};
  const script = opts.story ?? defaultStory;
  const NAMES = { teacher: 'Professor', you: 'You', thought: 'You', narrator: '' };
  const DEATHS = {
    intelligence: 'Your mind goes quiet... It died from lack of nural activiy...',
    health: 'Your body gives out cause you picked some bad options numnuts',
    thirst: 'No water? A blue figure flashes for a split second...',
    hunger: 'Are you embarrased? I would be...',
  };
  root.innerHTML = `<div class="vn" data-aggro="0" tabindex="0"><div class="place"></div>
    <div class="bot"><div class="screen"><i class="eye"></i><i class="eye"></i><b class="mouth"></b></div>
    <div class="pad"><u></u><u></u><u></u></div></div>
    <div class="choices"></div>
    <div class="box" data-who="narrator"><div class="name"></div><p class="text"></p><span class="next">&#9660;</span></div>
    <div class="debug" hidden></div><div class="over" hidden></div></div>`;
  const $ = (s) => root.querySelector(s);
  const vn = $('.vn'), box = $('.box'), nameEl = $('.name'), textEl = $('.text');
  const nextEl = $('.next'), choicesEl = $('.choices'), overEl = $('.over');
  const dbg = $('.debug'), placeEl = $('.place'), bot = $('.bot');
  let stats = new Stats(), seen = [], pendingTap = null, cancelled = false;
  const controller = new AbortController();
  class Dead extends Error {}
  class Stopped extends Error {}
  const assertActive = () => { if (cancelled) throw new Stopped(); };
  const sleep = (ms) => new Promise((resolve, reject) => {
    if (controller.signal.aborted) return reject(new Stopped());
    const timer = setTimeout(() => { controller.signal.removeEventListener('abort', stop); resolve(); }, ms);
    function stop() { clearTimeout(timer); reject(new Stopped()); }
    controller.signal.addEventListener('abort', stop, { once: true });
  });
  const waitTap = () => new Promise((resolve, reject) => {
    assertActive();
    function stop() { pendingTap = null; reject(new Stopped()); }
    pendingTap = () => { controller.signal.removeEventListener('abort', stop); pendingTap = null; resolve(); };
    controller.signal.addEventListener('abort', stop, { once: true });
  });
  const onTap = (event) => {
    if (event.target.closest('button')) return;
    pendingTap?.();
  };
  const onKey = (event) => {
    if ((event.key === ' ' || event.key === 'Enter') && !event.target.closest('button')) {
      event.preventDefault(); pendingTap?.();
    }
  };
  root.addEventListener('click', onTap);
  vn.addEventListener('keydown', onKey);

  const parse = (s) => String(s).split('*').map((t, i) => ({ t, g: i % 2 === 1 })).filter(x => x.t);
  const esc = (s) => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const render = (segments, n) => segments.map(s => {
    const part = esc(s.t.slice(0, Math.max(0, n))); n -= s.t.length;
    return s.g ? `<span class="glitch">${part}</span>` : part;
  }).join('');

  async function say(who, text, wait = true) {
    assertActive();
    box.dataset.who = who;
    nameEl.textContent = NAMES[who] ?? who;
    nameEl.hidden = !nameEl.textContent;
    bot.classList.toggle('talk', who === 'teacher');
    const segments = parse(text);
    const total = segments.reduce((sum, s) => sum + s.t.length, 0);
    let skip = false;
    nextEl.hidden = true;
    pendingTap = () => { skip = true; };
    for (let n = 1; n <= total && !skip; n++) {
      textEl.innerHTML = render(segments, n);
      await sleep(18);
    }
    assertActive();
    textEl.innerHTML = render(segments, total);
    bot.classList.remove('talk');
    pendingTap = null;
    if (wait) {
      nextEl.hidden = false;
      await waitTap();
      nextEl.hidden = true;
    }
  }

  function pick(labels) {
    assertActive();
    return new Promise((resolve, reject) => {
      choicesEl.replaceChildren();
      const stop = () => { choicesEl.replaceChildren(); reject(new Stopped()); };
      controller.signal.addEventListener('abort', stop, { once: true });
      labels.forEach((label, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = label;
        button.onclick = (event) => {
          event.stopPropagation();
          controller.signal.removeEventListener('abort', stop);
          choicesEl.replaceChildren();
          resolve(index);
        };
        choicesEl.append(button);
      });
      choicesEl.querySelector('button')?.focus();
    });
  }
  function hit(fx = {}) {
    stats.apply(fx);
    if (stats.dead) throw new Dead(stats.dead);
  }
  function validateQuestion(q) {
    if (!q || typeof q.prompt !== 'string' || !Array.isArray(q.choices) || q.choices.length < 2 ||
        !Number.isInteger(q.correctIndex) || q.correctIndex < 0 || q.correctIndex >= q.choices.length) {
      throw new Error('Question provider returned an invalid question. Expected {id,prompt,choices,correctIndex}.');
    }
    return q;
  }

  async function play(nodes) {
    for (const node of nodes) {
      assertActive();
      if (node.t === 'scene') {
        vn.dataset.aggro = String(Math.max(0, Math.min(3, Math.round(node.aggro * 3))));
        placeEl.textContent = node.name;
      } else if (node.t === 'say') {
        await say(node.who, node.text);
      } else if (node.t === 'choice') {
        const index = await pick(node.options.map(o => o.label));
        const option = node.options[index];
        hooks.onChoice?.({ label: option.label, fx: option.fx });
        hit(option.fx);
        await play(option.then ?? []);
      } else if (node.t === 'q') {
        const difficulty = Number(vn.dataset.aggro) / 3;
        const question = validateQuestion(await getQuestion({ difficulty, seen: [...seen] }));
        assertActive();
        seen.push(question.id ?? `question-${seen.length + 1}`);
        await say('teacher', question.prompt, false);
        const index = await pick(question.choices);
        const correct = index === question.correctIndex;
        hooks.onAnswer?.({ question, correct, choiceIndex: index });
        await play(correct ? node.right : node.wrong);
        if (!correct) {
          await say('narrator', `Correct answer: ${question.choices[question.correctIndex]}.${question.explanation ? ' ' + question.explanation : ''}`);
          hit({ intelligence: -1 });
        }
        stats.tick();
        hit({});
      } else if (node.t === 'end') {
        await say('narrator', node.text, false);
        hooks.onEnd?.({ stats: stats.snapshot() });
        await showOverlay('Chapter complete', node.text);
        return;
      }
    }
    hooks.onEnd?.({ stats: stats.snapshot() });
    await showOverlay('Chapter complete', 'You survived this chapter.');
  }

  async function showOverlay(title, message) {
    assertActive();
    overEl.replaceChildren();
    const h = document.createElement('h2'); h.textContent = title;
    const p = document.createElement('p'); p.textContent = message;
    const button = document.createElement('button'); button.type = 'button'; button.textContent = 'Play again';
    overEl.append(h, p, button);
    overEl.hidden = false;
    await new Promise((resolve, reject) => {
      const stop = () => reject(new Stopped());
      controller.signal.addEventListener('abort', stop, { once: true });
      button.onclick = () => { controller.signal.removeEventListener('abort', stop); resolve(); };
      button.focus();
    });
    assertActive();
  }

  async function run() {
    while (!cancelled) {
      stats = new Stats(); seen = []; overEl.hidden = true; choicesEl.replaceChildren();
      vn.dataset.aggro = '0'; placeEl.textContent = ''; textEl.textContent = '';
      dbg.hidden = !new URLSearchParams(window.location.search).has('debug');
      if (!dbg.hidden) {
        const show = s => { dbg.textContent = Object.entries(s).map(([k, v]) => `${k}:${v}`).join('  '); };
        stats.onChange(show); show(stats.snapshot());
      }
      try { await play(script); }
      catch (error) {
        if (error instanceof Stopped || cancelled) return;
        if (!(error instanceof Dead)) {
          console.error('Gameplay error:', error);
          await showOverlay('Gameplay error', error.message || 'Something went wrong.');
          continue;
        }
        hooks.onDeath?.({ cause: error.message, stats: stats.snapshot() });
        vn.dataset.aggro = '3'; choicesEl.replaceChildren();
        // Say what killed you first, then show the game-over screen.
        await say('narrator', DEATHS[error.message] ?? 'Your adventure has ended.');
        await showOverlay('You died', `Cause of death: ${error.message}`);
      }
    }
  }
  void run().catch(error => { if (!cancelled) console.error('Uncaught game error:', error); });
  vn.focus();
  return {
    stats: () => stats.snapshot(),
    destroy() {
      if (cancelled) return;
      cancelled = true;
      controller.abort();
      root.removeEventListener('click', onTap);
      vn.removeEventListener('keydown', onKey);
      root.replaceChildren();
    },
  };
}