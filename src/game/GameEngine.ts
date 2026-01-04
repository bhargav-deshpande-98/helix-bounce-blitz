// Game Engine for Helix Jump - Matching reference implementation

export interface GameState {
  score: number;
  bestScore: number;
  currentLevel: number;
  isGameOver: boolean;
  isPaused: boolean;
  isPlaying: boolean;
}

export const GAME_CONFIG = {
  // Ball settings
  BALL_RADIUS: 0.5,
  BALL_COLOR: 0xff0044, // Vibrant Pink/Red
  BALL_START_Y: 4,
  BALL_Z_POSITION: 4.5, // Fixed Z position on tower edge
  
  // Tower settings
  PILLAR_RADIUS: 2,
  PILLAR_COLOR: 0xffffff,
  PLATFORM_RADIUS: 6,
  LEVEL_GAP: 8,
  PLATFORM_COUNT: 200,
  
  // Physics
  GRAVITY: 0.015,
  BOUNCE_FORCE: 0.4,
  TERMINAL_VELOCITY: -0.8,
  
  // Controls
  ROTATION_SPEED: 0.008,
  
  // Colors for platforms
  COLORS: [0x2ecc71, 0x3498db, 0x9b59b6, 0xf1c40f, 0xe74c3c, 0x1abc9c],
  DANGER_COLOR: 0xb71540,
  
  // Background
  BACKGROUND_COLOR: 0xa8e6cf,
};

export function createInitialState(): GameState {
  const bestScore = parseInt(localStorage.getItem('helixBestScore') || '0', 10);
  return {
    score: 0,
    bestScore,
    currentLevel: 0,
    isGameOver: false,
    isPaused: false,
    isPlaying: false,
  };
}

export function saveBestScore(score: number): void {
  const currentBest = parseInt(localStorage.getItem('helixBestScore') || '0', 10);
  if (score > currentBest) {
    localStorage.setItem('helixBestScore', score.toString());
  }
}
