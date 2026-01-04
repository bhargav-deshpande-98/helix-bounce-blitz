import React, { useState, useCallback } from 'react';
import GameScene from './GameScene';
import GameHUD from './GameHUD';
import StartScreen from './StartScreen';
import GameOverScreen from './GameOverScreen';
import { GameState, createInitialState, saveBestScore } from '@/game/GameEngine';

const HelixJump: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(createInitialState);
  const [showPerfect, setShowPerfect] = useState(false);
  const [isNewBest, setIsNewBest] = useState(false);

  const handleStart = useCallback(() => {
    setGameState((prev) => ({
      ...createInitialState(),
      bestScore: prev.bestScore,
      isPlaying: true,
    }));
    setIsNewBest(false);
  }, []);

  const handlePerfect = useCallback(() => {
    setShowPerfect(true);
    setTimeout(() => setShowPerfect(false), 800);
  }, []);

  const handleBounce = useCallback(() => {
    // Could add haptic feedback here
  }, []);

  const handleGameOver = useCallback(() => {
    setGameState((prev) => {
      const newBest = prev.score > prev.bestScore;
      if (newBest) {
        saveBestScore(prev.score);
        setIsNewBest(true);
      }
      return {
        ...prev,
        isGameOver: true,
        isPlaying: false,
        bestScore: newBest ? prev.score : prev.bestScore,
      };
    });
  }, []);

  const handleRestart = useCallback(() => {
    setGameState((prev) => ({
      ...createInitialState(),
      bestScore: prev.bestScore,
      isPlaying: true,
    }));
    setIsNewBest(false);
  }, []);

  return (
    <div className="game-container w-full h-full">
      {/* 3D Game Scene */}
      <GameScene
        gameState={gameState}
        setGameState={setGameState}
        onPerfect={handlePerfect}
        onBounce={handleBounce}
        onGameOver={handleGameOver}
      />

      {/* HUD Overlay */}
      {gameState.isPlaying && !gameState.isGameOver && (
        <GameHUD gameState={gameState} showPerfect={showPerfect} />
      )}

      {/* Start Screen */}
      {!gameState.isPlaying && !gameState.isGameOver && (
        <StartScreen bestScore={gameState.bestScore} onStart={handleStart} />
      )}

      {/* Game Over Screen */}
      {gameState.isGameOver && (
        <GameOverScreen
          score={gameState.score}
          bestScore={gameState.bestScore}
          isNewBest={isNewBest}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
};

export default HelixJump;
