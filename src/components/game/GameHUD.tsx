import React from 'react';
import { GameState } from '@/game/GameEngine';

interface GameHUDProps {
  gameState: GameState;
  showPerfect: boolean;
}

const GameHUD: React.FC<GameHUDProps> = ({ gameState, showPerfect }) => {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Score Display - Top */}
      <div className="absolute top-4 left-0 right-0 flex flex-col items-center">
        <div className="score-display text-6xl md:text-7xl font-bold">
          {gameState.score}
        </div>
        {gameState.bestScore > 0 && (
          <div className="text-sm text-muted-foreground mt-1 font-display">
            BEST: {gameState.bestScore}
          </div>
        )}
      </div>

      {/* Perfect Text Animation */}
      {showPerfect && (
        <div className="absolute top-1/3 left-0 right-0 flex justify-center">
          <div className="perfect-text text-4xl md:text-5xl font-bold animate-perfect-pop">
            PERFECT!
          </div>
        </div>
      )}

      {/* Level Progress - Right Side */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
        {Array.from({ length: 5 }, (_, i) => {
          const level = gameState.currentLevel + 3 - i;
          if (level < 0) return null;
          const isCurrentLevel = level === gameState.currentLevel;
          return (
            <div
              key={i}
              className={`
                level-indicator w-10 h-10 rounded-full flex items-center justify-center
                transition-all duration-300
                ${isCurrentLevel 
                  ? 'bg-primary text-primary-foreground scale-110 shadow-lg' 
                  : 'bg-muted/80 text-muted-foreground'
                }
              `}
            >
              {level}
            </div>
          );
        })}
      </div>

      {/* Bounce Counter - Bottom Left */}
      <div className="absolute bottom-6 left-4">
        <div className="bounce-counter text-secondary-foreground">
          <div className="text-xs opacity-80">BOUNCES</div>
          <div className="text-2xl font-bold font-game">{gameState.bounceCount}</div>
        </div>
      </div>

      {/* Perfect Streak Indicator */}
      {gameState.perfectStreak >= 2 && (
        <div className="absolute bottom-6 right-4">
          <div className="hud-panel">
            <div className="text-xs text-muted-foreground">STREAK</div>
            <div className="text-2xl font-bold text-accent font-game">
              x{gameState.perfectStreak}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameHUD;
