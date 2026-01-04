import React from 'react';
import { GameState } from '@/game/GameEngine';

interface GameHUDProps {
  gameState: GameState;
}

const GameHUD: React.FC<GameHUDProps> = ({ gameState }) => {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Score Display - Top Center */}
      <div className="absolute top-[15%] left-0 right-0 flex flex-col items-center">
        <div className="score-display text-7xl md:text-8xl font-black">
          {gameState.score}
        </div>
      </div>
    </div>
  );
};

export default GameHUD;
