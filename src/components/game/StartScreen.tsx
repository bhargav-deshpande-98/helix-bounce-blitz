import React from 'react';

interface StartScreenProps {
  bestScore: number;
  onStart: () => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ bestScore, onStart }) => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-background/90 to-background/70 backdrop-blur-sm z-10">
      {/* Game Title */}
      <div className="mb-8 text-center">
        <h1 className="text-5xl md:text-7xl font-game score-display mb-2">
          HELIX
        </h1>
        <h2 className="text-4xl md:text-6xl font-game text-secondary">
          JUMP
        </h2>
      </div>

      {/* Ball Animation */}
      <div className="mb-8">
        <div className="w-16 h-16 rounded-full bg-primary shadow-lg animate-bounce-custom"
          style={{
            background: 'radial-gradient(circle at 30% 30%, #ff6b6b, #E84855)',
            boxShadow: '0 8px 32px rgba(232, 72, 85, 0.4), inset 0 -4px 8px rgba(0,0,0,0.2)',
          }}
        >
          <div 
            className="w-4 h-4 rounded-full bg-white/60 ml-3 mt-2"
            style={{ filter: 'blur(1px)' }}
          />
        </div>
      </div>

      {/* Best Score */}
      {bestScore > 0 && (
        <div className="mb-8 text-center">
          <div className="text-muted-foreground text-sm font-display">BEST SCORE</div>
          <div className="text-3xl font-bold font-game text-accent">{bestScore}</div>
        </div>
      )}

      {/* Start Button */}
      <button
        onClick={onStart}
        className="game-button animate-pulse-glow"
      >
        TAP TO START
      </button>

      {/* Instructions */}
      <div className="mt-8 text-center text-muted-foreground text-sm max-w-xs px-4">
        <p className="font-display">
          Swipe left or right to rotate the tower and guide the ball through the gaps
        </p>
      </div>
    </div>
  );
};

export default StartScreen;
