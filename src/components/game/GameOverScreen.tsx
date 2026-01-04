import React from 'react';

interface GameOverScreenProps {
  score: number;
  bestScore: number;
  isNewBest: boolean;
  onRestart: () => void;
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({
  score,
  bestScore,
  isNewBest,
  onRestart,
}) => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-background/95 to-background/85 backdrop-blur-md z-10 animate-fade-in">
      {/* Game Over Title */}
      <div className="mb-6 text-center">
        <h1 className="text-4xl md:text-5xl font-game text-destructive mb-2">
          GAME OVER
        </h1>
        {isNewBest && (
          <div className="text-xl font-game perfect-text animate-perfect-pop">
            NEW BEST!
          </div>
        )}
      </div>

      {/* Score Display */}
      <div className="hud-panel mb-8 text-center min-w-[200px]">
        <div className="text-muted-foreground text-sm font-display mb-1">SCORE</div>
        <div className="text-5xl font-bold font-game score-display">{score}</div>
        
        <div className="h-px bg-border my-4" />
        
        <div className="text-muted-foreground text-sm font-display mb-1">BEST</div>
        <div className="text-2xl font-bold font-game text-accent">{bestScore}</div>
      </div>

      {/* Restart Button */}
      <button
        onClick={onRestart}
        className="game-button animate-slide-up"
      >
        PLAY AGAIN
      </button>

      {/* Share hint */}
      <div className="mt-6 text-muted-foreground text-sm font-display">
        Can you beat your score?
      </div>
    </div>
  );
};

export default GameOverScreen;
