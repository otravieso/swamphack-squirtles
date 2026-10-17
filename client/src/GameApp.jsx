
import { useEffect, useRef } from 'react';
import { startGame } from './game/game.js';

export default function GameApp() {
  const gameRoot = useRef(null);

  useEffect(() => {
    const game = startGame(gameRoot.current);

    return () => {
      game.destroy();
    };
  }, []);

  return <div ref={gameRoot} />;
}
