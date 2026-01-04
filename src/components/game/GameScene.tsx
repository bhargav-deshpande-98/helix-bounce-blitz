import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import HelixTower from './HelixTower';
import Ball from './Ball';
import {
  GameState,
  Platform,
  Ball as BallType,
  GAME_CONFIG,
  generatePlatforms,
  updateBall,
  checkPlatformCollision,
  bounceBall,
  saveBestScore,
} from '@/game/GameEngine';

interface GameSceneProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  onPerfect: () => void;
  onBounce: () => void;
  onGameOver: () => void;
}

const GameContent: React.FC<GameSceneProps> = ({
  gameState,
  setGameState,
  onPerfect,
  onBounce,
  onGameOver,
}) => {
  const { camera, gl } = useThree();
  
  const [platforms, setPlatforms] = useState<Platform[]>(() => generatePlatforms(0, 50));
  const [ball, setBall] = useState<BallType>({
    x: 0,
    y: GAME_CONFIG.BALL_START_Y,
    z: GAME_CONFIG.TOWER_RADIUS * 0.7,
    velocityY: 0,
    radius: GAME_CONFIG.BALL_RADIUS,
  });
  const [towerRotation, setTowerRotation] = useState(0);
  const [isBouncing, setIsBouncing] = useState(false);
  const [cameraY, setCameraY] = useState(5);
  
  const lastLevelRef = useRef(0);
  const isDraggingRef = useRef(false);
  const lastTouchXRef = useRef(0);
  const perfectStreakRef = useRef(0);
  const passedLevelsRef = useRef<Set<number>>(new Set());

  // Set up camera
  useEffect(() => {
    camera.position.set(0, 5, 8);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  // Touch/Mouse handlers for rotating the tower
  const handlePointerDown = useCallback((e: PointerEvent) => {
    if (!gameState.isPlaying || gameState.isGameOver) return;
    isDraggingRef.current = true;
    lastTouchXRef.current = e.clientX;
  }, [gameState.isPlaying, gameState.isGameOver]);

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!isDraggingRef.current || !gameState.isPlaying || gameState.isGameOver) return;
    
    const deltaX = e.clientX - lastTouchXRef.current;
    lastTouchXRef.current = e.clientX;
    
    // Rotate tower based on drag
    setTowerRotation((prev) => prev + deltaX * 0.01);
  }, [gameState.isPlaying, gameState.isGameOver]);

  const handlePointerUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  // Set up event listeners
  useEffect(() => {
    const domElement = gl.domElement;
    domElement.addEventListener('pointerdown', handlePointerDown);
    domElement.addEventListener('pointermove', handlePointerMove);
    domElement.addEventListener('pointerup', handlePointerUp);
    domElement.addEventListener('pointerleave', handlePointerUp);

    return () => {
      domElement.removeEventListener('pointerdown', handlePointerDown);
      domElement.removeEventListener('pointermove', handlePointerMove);
      domElement.removeEventListener('pointerup', handlePointerUp);
      domElement.removeEventListener('pointerleave', handlePointerUp);
    };
  }, [gl.domElement, handlePointerDown, handlePointerMove, handlePointerUp]);

  // Reset game
  useEffect(() => {
    if (!gameState.isPlaying && !gameState.isGameOver) {
      // Reset when not playing and not game over (initial state)
      setPlatforms(generatePlatforms(0, 50));
      setBall({
        x: 0,
        y: GAME_CONFIG.BALL_START_Y,
        z: GAME_CONFIG.TOWER_RADIUS * 0.7,
        velocityY: 0,
        radius: GAME_CONFIG.BALL_RADIUS,
      });
      setTowerRotation(0);
      setCameraY(5);
      lastLevelRef.current = 0;
      perfectStreakRef.current = 0;
      passedLevelsRef.current = new Set();
    }
  }, [gameState.isPlaying, gameState.isGameOver]);

  // Game loop
  useFrame((state, delta) => {
    if (!gameState.isPlaying || gameState.isGameOver || gameState.isPaused) return;

    const deltaTime = Math.min(delta * 60, 3); // Normalize to ~60fps, cap for stability
    
    // Update ball physics
    const newBall = updateBall(ball, deltaTime);
    
    // Find current platform level
    const currentLevel = Math.floor(-newBall.y / GAME_CONFIG.PLATFORM_GAP);
    
    // Check collision with platforms
    let hitPlatform = false;
    let hitDanger = false;
    let passedThrough = false;
    
    for (const platform of platforms) {
      if (Math.abs(platform.level - currentLevel) <= 1) {
        const collision = checkPlatformCollision(newBall, platform, towerRotation);
        
        if (collision.hit) {
          hitPlatform = true;
          hitDanger = collision.isDanger;
          break;
        }
        
        if (collision.passedThrough && !passedLevelsRef.current.has(platform.level)) {
          passedThrough = true;
          passedLevelsRef.current.add(platform.level);
        }
      }
    }

    if (hitDanger) {
      // Game over!
      saveBestScore(gameState.score);
      onGameOver();
      return;
    }

    if (hitPlatform && newBall.velocityY < 0) {
      // Bounce!
      const bouncedBall = bounceBall(newBall);
      setBall(bouncedBall);
      setIsBouncing(true);
      setTimeout(() => setIsBouncing(false), 100);
      
      perfectStreakRef.current = 0;
      onBounce();
      
      setGameState((prev) => ({
        ...prev,
        bounceCount: prev.bounceCount + 1,
      }));
    } else {
      setBall(newBall);
      setIsBouncing(false);
    }

    // Score points for passing through levels
    if (passedThrough) {
      perfectStreakRef.current++;
      
      if (perfectStreakRef.current >= 3) {
        onPerfect();
      }
      
      const points = GAME_CONFIG.POINTS_PER_LEVEL + 
        (perfectStreakRef.current >= 3 ? GAME_CONFIG.PERFECT_BONUS * perfectStreakRef.current : 0);
      
      setGameState((prev) => ({
        ...prev,
        score: prev.score + points,
        currentLevel: currentLevel,
        perfectStreak: perfectStreakRef.current,
      }));
    }

    // Update level tracking
    if (currentLevel > lastLevelRef.current) {
      lastLevelRef.current = currentLevel;
    }

    // Smoothly follow ball with camera
    const targetCameraY = newBall.y + 3;
    setCameraY((prev) => THREE.MathUtils.lerp(prev, targetCameraY, 0.05));
    camera.position.y = cameraY;
    camera.lookAt(0, newBall.y - 2, 0);

    // Generate more platforms as needed
    if (currentLevel > platforms.length - 20) {
      setPlatforms((prev) => [
        ...prev,
        ...generatePlatforms(prev.length, 20),
      ]);
    }
  });

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[5, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-5, 5, -5]} intensity={0.3} />
      <pointLight position={[0, ball.y + 2, 3]} intensity={0.5} color="#ffaa00" />
      
      {/* Sky/Background gradient effect */}
      <mesh position={[0, 0, -20]}>
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial color="#ffeedd" />
      </mesh>

      {/* Helix Tower */}
      <HelixTower platforms={platforms} rotation={towerRotation} />

      {/* Ball */}
      <Ball
        position={[ball.x, ball.y, ball.z]}
        isBouncing={isBouncing}
      />
    </>
  );
};

const GameScene: React.FC<GameSceneProps> = (props) => {
  return (
    <Canvas
      camera={{ fov: 60, near: 0.1, far: 1000 }}
      style={{ touchAction: 'none' }}
      gl={{ antialias: true, alpha: true }}
    >
      <GameContent {...props} />
    </Canvas>
  );
};

export default GameScene;
