import React, { useCallback, useEffect, useRef, useState } from 'react';
import Robot from './components/Robot.jsx';
import DialogueBox from './components/DialogueBox.jsx';
import ChoiceBox from './components/ChoiceBox.jsx';
import GameOver from './components/GameOver.jsx';
import ExitNotFound from './components/ExitNotFound.jsx';
import { story } from './game/story.js';
import { Stats } from './game/stats.js';
import { getQuestion } from './game/questionProvider.js';
import { SCENES, sceneFor, preloadScenes } from './game/scenes.js';
import './game/game.css';

// Shown on the game-over screen, depending on which stat ran out.
const DEATHS = {
  intelligence: 'You died from lack of intelligence! Ya smooth brain!',
  health: "Ya died cause your health ran out. I mean, let's not pretend those were smart decisions… The guy next to me is eating a donut right now. I’d give it to you but you don’t deserve it.",
  thirst: 'You died of thirst. Skill issue. No water? (blue man flashes before you)',
  hunger: "You died cause you got hungry. Hunger, more like FUNGER. Ya KNOW. Cause this IS FUN. God I'm so tired it's 4:32am please send help.",
};

// scene('404', ...) in story.js shows the "404 Exit Not Found" page instead of a background.
const EXIT_SCENE = 'exit404';
const REFRESH_DELAY_MS = 1600; // how long "REFRESHING…" shows after choosing Yes

const initialView = () => ({ place: '', scene: null, aggro: 0, lastChoice: null, refreshing: false, dialogue: null, choices: null, ending: null, stats: null });

// This component owns the game state; no innerHTML, document.createElement or manual event listeners.
export default function GameApp({ script = story, hooks = {} }) {
  const [view, setView] = useState(initialView);
  const [typing, setTyping] = useState(false);
  const runtime = useRef(null);
  const hooksRef = useRef(hooks);
  hooksRef.current = hooks;
  const generation = useRef(0);

  const publish = useCallback((patch) => setView(previous => ({ ...previous, ...patch })), []);
  const finish = useCallback((title, message) => {
    const game = runtime.current;
    if (!game) return;
    game.mode = 'ended';
    publish({ choices: null, ending: { title, message }, stats: game.stats.snapshot() });
    if (title === 'Chapter complete') hooksRef.current.onEnd?.({ stats: game.stats.snapshot() });
    else if (title === 'You died') hooksRef.current.onDeath?.({ cause: game.stats.dead, stats: game.stats.snapshot() });
  }, [publish]);

  // Change stats but don't end the game yet: the outcome narration plays first,
  // then a { t: '_checkDeath' } step ends the game if a stat reached 0.
  const changeStats = useCallback((effects = {}) => {
    const game = runtime.current;
    game.stats.apply(effects);
    publish({ stats: game.stats.snapshot() });
  }, [publish]);

  const apply = useCallback((effects = {}) => {
    const game = runtime.current;
    game.stats.apply(effects);
    publish({ stats: game.stats.snapshot() });
    if (game.stats.dead) {
      finish('You died', DEATHS[game.stats.dead] ?? 'Your adventure has ended.');
      return false;
    }
    return true;
  }, [finish, publish]);

  const advance = useCallback(async () => {
    const game = runtime.current;
    if (!game || game.mode !== 'ready') return;
    game.mode = 'processing';
    const token = generation.current;
    try {
      while (game.queue.length && generation.current === token) {
        const node = game.queue.shift();
        if (node.t === 'scene') {
          // Switch the background to match where the dialogue is happening.
          const where = sceneFor(node.name);
          const scene = node.name === '404' ? EXIT_SCENE : where?.key ?? null;
          game.scene = scene;
          publish({ place: node.name, scene, aggro: Math.max(0, Math.min(3, Math.round(node.aggro * 3))) });
        } else if (node.t === 'say') {
          game.mode = 'dialogue';
          publish({ dialogue: { ...node }, choices: null });
          return;
        } else if (node.t === 'choice') {
          game.mode = 'choice';
          // On the 404 page keep "Do you want to refresh?" on screen above the Yes/No buttons.
          publish({ choices: { kind: 'choice', options: node.options } });
          return;
        } else if (node.t === 'q') {
          const question = await getQuestion({ difficulty: game.aggro / 3, seen: [...game.seen] });
          if (generation.current !== token) return;
          if (!question || typeof question.prompt !== 'string' || !Array.isArray(question.choices) || question.choices.length < 2 ||
              !Number.isInteger(question.correctIndex) || question.correctIndex < 0 || question.correctIndex >= question.choices.length) {
            throw new Error('Question provider returned an invalid question.');
          }
          game.seen.push(question.id ?? `question-${game.seen.length + 1}`);
          game.mode = 'questionPrompt';
          game.currentQuestion = { question, node };
          publish({ dialogue: { t: 'say', who: 'teacher', text: question.prompt }, choices: null });
          return;
        } else if (node.t === '_feedback') {
          changeStats({ intelligence: -1 }); // game over (if any) comes after this text, via _checkDeath
          game.mode = 'dialogue';
          publish({ dialogue: { t: 'say', who: 'narrator', text: node.text }, choices: null });
          return;
        } else if (node.t === '_checkDeath') {
          if (!apply({})) return; // a stat hit 0 during the decision/answer above -> game over now
        } else if (node.t === '_tick') {
          game.stats.tick();
          if (!apply({})) return;
        } else if (node.t === 'end') {
          publish({ dialogue: { t: 'say', who: 'narrator', text: node.text } });
          finish('Chapter complete', node.text);
          return;
        }
        // Keep difficulty synchronized with the scene currently displayed.
        if (node.t === 'scene') game.aggro = Math.max(0, Math.min(3, Math.round(node.aggro * 3)));
      }
      if (generation.current === token) finish('Chapter complete', 'You survived this chapter.');
    } catch (error) {
      if (generation.current === token) {
        console.error('Gameplay error:', error);
        finish('Gameplay error', error?.message ?? 'Something went wrong.');
      }
    }
  }, [apply, changeStats, finish, publish]);

  const restart = useCallback(() => {
    generation.current += 1;
    runtime.current = { stats: new Stats(), queue: [...script], seen: [], aggro: 0, mode: 'ready', currentQuestion: null };
    setTyping(false);
    setView({ ...initialView(), stats: runtime.current.stats.snapshot() });
    // Run after React has committed the new screen.
    queueMicrotask(() => { if (runtime.current?.mode === 'ready') void advance(); });
  }, [script, advance]);

  useEffect(() => { preloadScenes(); }, []);

  useEffect(() => {
    restart();
    return () => { generation.current += 1; runtime.current = null; };
  }, [restart]);

  // End of the script on the 404 page: "Do you want to refresh?" → Yes refreshes (restarts).
  // No leaves the player on the page; the REFRESH sign restarts whenever they're ready.
  const atExit = view.scene === EXIT_SCENE;
  const beatGame = atExit && view.ending?.title === 'Chapter complete';
  const refresh = useCallback(() => publish({ refreshing: true }), [publish]);
  useEffect(() => {
    if (beatGame && view.lastChoice === 'Yes' && !view.refreshing) refresh();
  }, [beatGame, view.lastChoice, view.refreshing, refresh]);
  useEffect(() => {
    if (!view.refreshing) return undefined;
    const timer = window.setTimeout(restart, REFRESH_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [view.refreshing, restart]);

  const next = useCallback(() => {
    const game = runtime.current;
    if (!game) return;
    if (game.mode === 'questionPrompt') {
      game.mode = 'question';
      publish({ choices: { kind: 'question', labels: game.currentQuestion.question.choices } });
    } else if (game.mode === 'dialogue') {
      game.mode = 'ready';
      void advance();
    }
  }, [advance, publish]);

  const choose = useCallback((index) => {
    const game = runtime.current;
    if (!game) return;
    if (game.mode === 'choice') {
      const option = view.choices?.options?.[index];
      if (!option) return;
      hooksRef.current.onChoice?.({ label: option.label, fx: option.fx });
      publish({ choices: null, lastChoice: option.label });
      changeStats(option.fx);
      game.queue.unshift(...(option.then ?? []), { t: '_checkDeath' });
    } else if (game.mode === 'question') {
      const { question, node } = game.currentQuestion;
      const correct = index === question.correctIndex;
      hooksRef.current.onAnswer?.({ question, correct, choiceIndex: index });
      const branch = correct ? node.right : node.wrong;
      const after = correct ? [] : [{ t: '_feedback', text: `Correct answer: ${question.choices[question.correctIndex]}.${question.explanation ? ' ' + question.explanation : ''}` }];
      game.queue.unshift(...branch, ...after, { t: '_checkDeath' }, { t: '_tick' });
      game.currentQuestion = null;
      publish({ choices: null });
    } else return;
    game.mode = 'ready';
    void advance();
  }, [view.choices, changeStats, advance, publish]);

  const debug = new URLSearchParams(window.location.search).has('debug');
  const choices = view.choices;
  // The 404 page is calm: no rage tint or scanlines there.
  const aggro = atExit ? 0 : view.ending?.title === 'You died' ? 3 : view.aggro;
  return <div className="vn" data-scene={view.scene ?? 'none'} data-aggro={aggro}>
    {/* One layer per location; only the active one is visible, so changing scene cross-fades. */}
    <div className="scenery" aria-hidden="true">
      {Object.values(SCENES).map(({ key, image }) => (
        <div key={key} className={`scenery-layer scenery-${key}${view.scene === key ? ' is-active' : ''}`}
          style={{ '--scene-img': `url("${image}")` }} />
      ))}
      <div className="scenery-tint" />
    </div>
    <div className="place" hidden={!view.place || atExit}>{view.place}</div>
    {atExit && <ExitNotFound canRefresh={beatGame} refreshing={view.refreshing} onRefresh={refresh} />}
    {!atExit && <Robot talking={view.dialogue?.who === 'teacher' && typing && !view.ending} />}
    {choices && <ChoiceBox labels={choices.kind === 'question' ? choices.labels : choices.options.map(o => o.label)} onSelect={choose} />}
    {!beatGame && <DialogueBox node={view.dialogue} waitingForChoice={Boolean(choices) || Boolean(view.ending)} onAdvance={next} onTypingChange={setTyping} />}
    {debug && view.stats && <div className="debug">{Object.entries(view.stats).map(([k, v]) => `${k}:${v}`).join('  ')}</div>}
    {view.ending && !beatGame && <GameOver {...view.ending} onRestart={restart} />}
  </div>;
}
