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
    <div 
      className="absolute inset-0 flex flex-col items-center justify-center z-20 animate-fade-in"
      style={{ 
        background: 'rgba(255, 71, 87, 0.9)',
        backdropFilter: 'blur(5px)',
      }}
    >
      {/* Game Over Title */}
      <div className="mb-6 text-center">
        <h1 className="text-5xl md:text-6xl font-game text-white mb-2">
          OOPS!
        </h1>
        {isNewBest && (
          <div className="text-xl font-game text-yellow-300 animate-perfect-pop">
            NEW BEST!
          </div>
        )}
      </div>

      {/* Score Display */}
      <div className="mb-8 text-center">
        <div className="text-white/80 text-lg font-display mb-1">Score</div>
        <div className="text-5xl font-bold font-game text-white">{score}</div>
        
        {bestScore > score && (
          <>
            <div className="h-px bg-white/30 my-4 w-32 mx-auto" />
            <div className="text-white/60 text-sm font-display mb-1">Best</div>
            <div className="text-2xl font-bold font-game text-white/80">{bestScore}</div>
          </>
        )}
      </div>

      {/* Restart Button */}
      <button
        onClick={onRestart}
        className="px-12 py-4 text-xl font-bold bg-white text-primary rounded-full shadow-lg transition-transform active:scale-95 hover:scale-105"
      >
        Tap to Restart
      </button>
    </div>
  );
};

export default GameOverScreen;
