import React, { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { GAME_CONFIG, GameState, saveBestScore, getDifficultyParams } from '@/game/GameEngine';

interface GameSceneProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  onGameOver: () => void;
}

const GameScene: React.FC<GameSceneProps> = ({
  gameState,
  setGameState,
  onGameOver,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const ballRef = useRef<THREE.Mesh | null>(null);
  const towerGroupRef = useRef<THREE.Group | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  
  // Physics state
  const ballVelocityYRef = useRef(0);
  const cameraMinYRef = useRef(15);
  const highestLevelPassedRef = useRef(0);
  const isDraggingRef = useRef(false);
  const previousMouseXRef = useRef(0);
  const animationIdRef = useRef<number>(0);
  const isGameOverRef = useRef(false);
  const isPlayingRef = useRef(false);

  // Update refs when gameState changes
  useEffect(() => {
    isGameOverRef.current = gameState.isGameOver;
    isPlayingRef.current = gameState.isPlaying;
  }, [gameState.isGameOver, gameState.isPlaying]);

  const createRing = useCallback((parentGroup: THREE.Group, color: number, addDanger: boolean, level: number) => {
    const difficulty = getDifficultyParams(level);
    const gapSize = Math.random() * difficulty.gapRange + difficulty.gapMin;
    const gapStart = Math.random() * Math.PI * 2;
    const totalArc = (Math.PI * 2) - gapSize;

    // Safe platform segment
    const safeGeo = new THREE.CylinderGeometry(
      GAME_CONFIG.PLATFORM_RADIUS,
      GAME_CONFIG.PLATFORM_RADIUS,
      0.5,
      64,
      1,
      false,
      gapStart + gapSize,
      totalArc
    );
    const safeMat = new THREE.MeshLambertMaterial({ color });
    const safeMesh = new THREE.Mesh(safeGeo, safeMat);
    safeMesh.userData = { type: 'safe' };
    safeMesh.castShadow = true;
    safeMesh.receiveShadow = true;
    parentGroup.add(safeMesh);

    // Add danger segment (probability increases with difficulty)
    if (addDanger && Math.random() < difficulty.dangerProbability) {
      const dangerSize = difficulty.dangerMin + Math.random() * difficulty.dangerRange;
      const dangerStart = gapStart + gapSize + 0.2;

      if (dangerSize < totalArc - 0.5) {
        const dangerGeo = new THREE.CylinderGeometry(
          GAME_CONFIG.PLATFORM_RADIUS + 0.05,
          GAME_CONFIG.PLATFORM_RADIUS + 0.05,
          0.55,
          64,
          1,
          false,
          dangerStart,
          dangerSize
        );
        const dangerMat = new THREE.MeshLambertMaterial({ color: GAME_CONFIG.DANGER_COLOR });
        const dangerMesh = new THREE.Mesh(dangerGeo, dangerMat);
        dangerMesh.userData = { type: 'danger' };
        parentGroup.add(dangerMesh);
      }
    }
  }, []);

  const generateLevels = useCallback((towerGroup: THREE.Group) => {
    let mainColor = GAME_CONFIG.COLORS[Math.floor(Math.random() * GAME_CONFIG.COLORS.length)];

    for (let i = 0; i < GAME_CONFIG.PLATFORM_COUNT; i++) {
      const y = -i * GAME_CONFIG.LEVEL_GAP;
      const levelGroup = new THREE.Group();
      levelGroup.position.y = y;
      towerGroup.add(levelGroup);

      // First level - no danger
      if (i === 0) {
        createRing(levelGroup, mainColor, false, i);
        continue;
      }

      // Change color every 7 levels
      if (i % 7 === 0) {
        mainColor = GAME_CONFIG.COLORS[Math.floor(Math.random() * GAME_CONFIG.COLORS.length)];
      }

      createRing(levelGroup, mainColor, true, i);
    }

    // Finish platform
    const finishGeo = new THREE.CylinderGeometry(
      GAME_CONFIG.PLATFORM_RADIUS,
      GAME_CONFIG.PLATFORM_RADIUS,
      1,
      32
    );
    const finishMat = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
    const finishMesh = new THREE.Mesh(finishGeo, finishMat);
    finishMesh.position.y = -GAME_CONFIG.PLATFORM_COUNT * GAME_CONFIG.LEVEL_GAP;
    finishMesh.userData = { type: 'finish' };
    towerGroup.add(finishMesh);
  }, [createRing]);

  const createGameWorld = useCallback((scene: THREE.Scene) => {
    // Remove old tower group if exists
    if (towerGroupRef.current) {
      scene.remove(towerGroupRef.current);
    }

    const towerGroup = new THREE.Group();
    scene.add(towerGroup);
    towerGroupRef.current = towerGroup;

    // Create pillar (central cylinder)
    const pillarHeight = GAME_CONFIG.PLATFORM_COUNT * GAME_CONFIG.LEVEL_GAP + 50;
    const pillarGeo = new THREE.CylinderGeometry(
      GAME_CONFIG.PILLAR_RADIUS,
      GAME_CONFIG.PILLAR_RADIUS,
      pillarHeight,
      64
    );
    const pillarMat = new THREE.MeshLambertMaterial({ color: GAME_CONFIG.PILLAR_COLOR });
    const pillar = new THREE.Mesh(pillarGeo, pillarMat);
    pillar.position.y = -pillarHeight / 2 + 10;
    pillar.receiveShadow = true;
    towerGroup.add(pillar);

    // Create ball
    if (ballRef.current) {
      scene.remove(ballRef.current);
    }
    const ballGeo = new THREE.SphereGeometry(GAME_CONFIG.BALL_RADIUS, 32, 32);
    const ballMat = new THREE.MeshPhongMaterial({
      color: GAME_CONFIG.BALL_COLOR,
      shininess: 50,
    });
    const ball = new THREE.Mesh(ballGeo, ballMat);
    ball.castShadow = true;
    ball.position.set(0, GAME_CONFIG.BALL_START_Y, GAME_CONFIG.BALL_Z_POSITION);
    scene.add(ball);
    ballRef.current = ball;

    // Generate level platforms
    generateLevels(towerGroup);
  }, [generateLevels]);

  const updateCameraPosition = useCallback(() => {
    const camera = cameraRef.current;
    const ball = ballRef.current;
    if (!camera || !ball) return;

    // Ratchet logic - camera only moves down, never up
    const idealCameraY = ball.position.y + 15;
    
    if (idealCameraY < cameraMinYRef.current) {
      cameraMinYRef.current = idealCameraY;
    }

    const lerpSpeed = 0.1;
    if (camera.position.y > cameraMinYRef.current) {
      camera.position.y += (cameraMinYRef.current - camera.position.y) * lerpSpeed;
    }

    camera.position.z = 40;
    camera.lookAt(0, camera.position.y - 20, 0);
  }, []);

  const handleGameOver = useCallback(() => {
    isGameOverRef.current = true;
    saveBestScore(highestLevelPassedRef.current * 10);
    onGameOver();
  }, [onGameOver]);

  const updatePhysics = useCallback(() => {
    const ball = ballRef.current;
    const towerGroup = towerGroupRef.current;
    if (!ball || !towerGroup) return;

    // Apply gravity
    ballVelocityYRef.current -= GAME_CONFIG.GRAVITY;
    if (ballVelocityYRef.current < GAME_CONFIG.TERMINAL_VELOCITY) {
      ballVelocityYRef.current = GAME_CONFIG.TERMINAL_VELOCITY;
    }

    // Raycast collision detection when falling
    if (ballVelocityYRef.current < 0) {
      const downVector = new THREE.Vector3(0, -1, 0);
      raycasterRef.current.set(ball.position, downVector);
      const intersects = raycasterRef.current.intersectObjects(towerGroup.children, true);

      if (intersects.length > 0) {
        const hit = intersects[0];
        const distance = hit.distance;
        const lookAheadThreshold = GAME_CONFIG.BALL_RADIUS + Math.abs(ballVelocityYRef.current) + 0.1;

        if (distance < lookAheadThreshold) {
          const type = hit.object.userData.type;

          if (type === 'danger') {
            handleGameOver();
            return;
          } else if (type === 'safe' || type === 'finish') {
            // Bounce off platform
            ball.position.y = hit.point.y + GAME_CONFIG.BALL_RADIUS;
            ballVelocityYRef.current = GAME_CONFIG.BOUNCE_FORCE;
            return;
          }
        }
      }
    }

    // Update ball position
    ball.position.y += ballVelocityYRef.current;

    // Update score based on levels passed
    const currentLevel = Math.floor(Math.abs(ball.position.y) / GAME_CONFIG.LEVEL_GAP);
    if (currentLevel > highestLevelPassedRef.current) {
      highestLevelPassedRef.current = currentLevel;
      setGameState(prev => ({
        ...prev,
        score: highestLevelPassedRef.current * 10,
        currentLevel: currentLevel,
      }));
    }

    // Check if ball fell too far
    if (ball.position.y < -GAME_CONFIG.PLATFORM_COUNT * GAME_CONFIG.LEVEL_GAP - 10) {
      handleGameOver();
    }
  }, [handleGameOver, setGameState]);

  const animate = useCallback(() => {
    animationIdRef.current = requestAnimationFrame(animate);

    if (!isGameOverRef.current && isPlayingRef.current) {
      updatePhysics();
      updateCameraPosition();
    }

    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
  }, [updatePhysics, updateCameraPosition]);

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(GAME_CONFIG.BACKGROUND_COLOR);
    scene.fog = new THREE.Fog(GAME_CONFIG.BACKGROUND_COLOR, 20, 70);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(0, 15, 40);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(20, 50, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);

    // Create game world
    createGameWorld(scene);

    // Initial camera position
    updateCameraPosition();

    // Start animation loop
    animate();

    // Handle resize
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationIdRef.current);
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, [animate, createGameWorld, updateCameraPosition]);

  // Reset game when starting new game
  useEffect(() => {
    if (gameState.isPlaying && !gameState.isGameOver) {
      // Reset state for new game
      ballVelocityYRef.current = 0;
      cameraMinYRef.current = 15;
      highestLevelPassedRef.current = 0;
      
      if (sceneRef.current) {
        createGameWorld(sceneRef.current);
      }
      
      if (cameraRef.current) {
        cameraRef.current.position.set(0, 15, 40);
      }
    }
  }, [gameState.isPlaying, gameState.isGameOver, createGameWorld]);

  // Touch/Mouse controls for tower rotation
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!gameState.isPlaying || gameState.isGameOver) return;
    isDraggingRef.current = true;
    previousMouseXRef.current = e.clientX;
  }, [gameState.isPlaying, gameState.isGameOver]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current || !gameState.isPlaying || gameState.isGameOver) return;
    
    const deltaX = e.clientX - previousMouseXRef.current;
    previousMouseXRef.current = e.clientX;

    if (towerGroupRef.current) {
      towerGroupRef.current.rotation.y += deltaX * GAME_CONFIG.ROTATION_SPEED;
    }
  }, [gameState.isPlaying, gameState.isGameOver]);

  const handlePointerUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ touchAction: 'none' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    />
  );
};

export default GameScene;
