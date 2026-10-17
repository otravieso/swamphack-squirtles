import React, { useCallback, useEffect, useRef, useState } from 'react';
import Robot from './components/Robot.jsx';
import DialogueBox from './components/DialogueBox.jsx';
import ChoiceBox from './components/ChoiceBox.jsx';
import GameOver from './components/GameOver.jsx';
import { story } from './game/story.js';
import { Stats } from './game/stats.js';
import { getQuestion } from './game/questionProvider.js';
import './game/game.css';

const DEATHS = {
  intelligence: 'Your mind goes quiet. The Professor smiles. "Lesson over."',
  health: 'Your body gives out. The Professor sighs. "Fragile things."',
  thirst: 'Your throat closes. The Professor hums. "Should have asked for water."',
  hunger: 'Your stomach finally stops asking. The Professor says, "Hm. Efficient."',
};

const initialView = () => ({ place: '', aggro: 0, dialogue: null, choices: null, ending: null, stats: null });

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
          publish({ place: node.name, aggro: Math.max(0, Math.min(3, Math.round(node.aggro * 3))) });
        } else if (node.t === 'say') {
          game.mode = 'dialogue';
          publish({ dialogue: { ...node }, choices: null });
          return;
        } else if (node.t === 'choice') {
          game.mode = 'choice';
          publish({ choices: { kind: 'choice', options: node.options }, dialogue: null });
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
          if (!apply({ intelligence: -1 })) return;
          game.mode = 'dialogue';
          publish({ dialogue: { t: 'say', who: 'narrator', text: node.text }, choices: null });
          return;
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
  }, [apply, finish, publish]);

  const restart = useCallback(() => {
    generation.current += 1;
    runtime.current = { stats: new Stats(), queue: [...script], seen: [], aggro: 0, mode: 'ready', currentQuestion: null };
    setTyping(false);
    setView({ ...initialView(), stats: runtime.current.stats.snapshot() });
    // Run after React has committed the new screen.
    queueMicrotask(() => { if (runtime.current?.mode === 'ready') void advance(); });
  }, [script, advance]);

  useEffect(() => {
    restart();
    return () => { generation.current += 1; runtime.current = null; };
  }, [restart]);

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
      publish({ choices: null });
      if (!apply(option.fx)) return;
      game.queue.unshift(...(option.then ?? []));
    } else if (game.mode === 'question') {
      const { question, node } = game.currentQuestion;
      const correct = index === question.correctIndex;
      hooksRef.current.onAnswer?.({ question, correct, choiceIndex: index });
      const branch = correct ? node.right : node.wrong;
      const after = correct ? [] : [{ t: '_feedback', text: `Correct answer: ${question.choices[question.correctIndex]}.${question.explanation ? ' ' + question.explanation : ''}` }];
      game.queue.unshift(...branch, ...after, { t: '_tick' });
      game.currentQuestion = null;
      publish({ choices: null });
    } else return;
    game.mode = 'ready';
    void advance();
  }, [view.choices, apply, advance, publish]);

  const debug = new URLSearchParams(window.location.search).has('debug');
  const choices = view.choices;
  return <div className="vn" data-aggro={view.ending?.title === 'You died' ? 3 : view.aggro}>
    <div className="place">{view.place}</div>
    <Robot talking={view.dialogue?.who === 'teacher' && typing && !view.ending} />
    {choices && <ChoiceBox labels={choices.kind === 'question' ? choices.labels : choices.options.map(o => o.label)} onSelect={choose} />}
    <DialogueBox node={view.dialogue} waitingForChoice={Boolean(choices) || Boolean(view.ending)} onAdvance={next} onTypingChange={setTyping} />
    {debug && view.stats && <div className="debug">{Object.entries(view.stats).map(([k, v]) => `${k}:${v}`).join('  ')}</div>}
    {view.ending && <GameOver {...view.ending} onRestart={restart} />}
  </div>;
}
