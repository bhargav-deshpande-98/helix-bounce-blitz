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
  PLATFORM_COUNT: 500, // Extended from 200 to 500 levels

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

  // Difficulty scaling (increases every DIFFICULTY_INTERVAL levels)
  DIFFICULTY_INTERVAL: 35,
};

// Get difficulty parameters based on current level
export function getDifficultyParams(level: number) {
  const tier = Math.floor(level / GAME_CONFIG.DIFFICULTY_INTERVAL);

  // Gap size decreases as difficulty increases (harder to navigate)
  // Starts at 0.7-1.5, minimum gap is 0.5-0.9 at max difficulty
  const gapMin = Math.max(0.5, 0.7 - tier * 0.025);
  const gapRange = Math.max(0.4, 0.8 - tier * 0.05);

  // Danger probability increases (more danger zones)
  // Starts at 60%, maxes at 85%
  const dangerProbability = Math.min(0.85, 0.6 + tier * 0.035);

  // Danger size increases (larger danger zones)
  // Starts at 0.5-1.0, maxes at 0.8-1.6
  const dangerMin = Math.min(0.8, 0.5 + tier * 0.04);
  const dangerRange = Math.min(0.8, 0.5 + tier * 0.04);

  return {
    gapMin,
    gapRange,
    dangerProbability,
    dangerMin,
    dangerRange,
    tier,
  };
}

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
