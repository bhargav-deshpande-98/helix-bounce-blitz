import React, { useState, useCallback } from 'react';
import GameScene from './GameScene';
import GameHUD from './GameHUD';
import StartScreen from './StartScreen';
import GameOverScreen from './GameOverScreen';
import { GameState, createInitialState, saveBestScore } from '@/game/GameEngine';

const HelixJump: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(createInitialState);
  const [isNewBest, setIsNewBest] = useState(false);
  const [gameKey, setGameKey] = useState(0); // Force remount of GameScene

  const handleStart = useCallback(() => {
    setGameKey(prev => prev + 1); // Force new game instance
    setGameState((prev) => ({
      ...createInitialState(),
      bestScore: prev.bestScore,
      isPlaying: true,
    }));
    setIsNewBest(false);
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
    setGameKey(prev => prev + 1); // Force new game instance
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
        key={gameKey}
        gameState={gameState}
        setGameState={setGameState}
        onGameOver={handleGameOver}
      />

      {/* HUD Overlay */}
      {gameState.isPlaying && !gameState.isGameOver && (
        <GameHUD gameState={gameState} />
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
