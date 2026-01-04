// Game Engine for Helix Jump
// Core game logic and physics

export interface GameState {
  score: number;
  bestScore: number;
  currentLevel: number;
  bounceCount: number;
  perfectStreak: number;
  isGameOver: boolean;
  isPaused: boolean;
  isPlaying: boolean;
}

export interface Platform {
  id: number;
  level: number;
  segments: PlatformSegment[];
  y: number;
}

export interface PlatformSegment {
  startAngle: number;
  endAngle: number;
  isDanger: boolean;
  color: string;
}

export interface Ball {
  x: number;
  y: number;
  z: number;
  velocityY: number;
  radius: number;
}

export const GAME_CONFIG = {
  // Tower settings
  TOWER_RADIUS: 1.2,
  TOWER_HEIGHT: 100,
  PLATFORM_HEIGHT: 0.15,
  PLATFORM_GAP: 1.8,
  SEGMENTS_PER_PLATFORM: 6,
  
  // Ball settings
  BALL_RADIUS: 0.18,
  BALL_START_Y: 8,
  GRAVITY: -0.015,
  BOUNCE_VELOCITY: 0.35,
  TERMINAL_VELOCITY: -0.8,
  
  // Gameplay
  POINTS_PER_LEVEL: 10,
  PERFECT_BONUS: 5,
  DANGER_CHANCE: 0.25,
  MIN_GAP_SEGMENTS: 1,
  MAX_GAP_SEGMENTS: 2,
  
  // Colors
  PLATFORM_COLORS: [
    '#E84855', // Red
    '#3185FC', // Blue  
    '#FFBE0B', // Yellow
    '#2EC4B6', // Cyan
    '#9B5DE5', // Purple
    '#F15BB5', // Pink
    '#00F5D4', // Teal
    '#FFA07A', // Light coral
  ],
  
  BALL_COLOR: '#E84855',
  DANGER_COLOR_1: '#1a1a1a',
  DANGER_COLOR_2: '#f5f5f5',
};

export function createInitialState(): GameState {
  const bestScore = parseInt(localStorage.getItem('helixBestScore') || '0', 10);
  return {
    score: 0,
    bestScore,
    currentLevel: 0,
    bounceCount: 0,
    perfectStreak: 0,
    isGameOver: false,
    isPaused: false,
    isPlaying: false,
  };
}

export function generatePlatforms(startLevel: number, count: number): Platform[] {
  const platforms: Platform[] = [];
  
  for (let i = 0; i < count; i++) {
    const level = startLevel + i;
    const platform = generatePlatform(level);
    platforms.push(platform);
  }
  
  return platforms;
}

function generatePlatform(level: number): Platform {
  const segments: PlatformSegment[] = [];
  const segmentCount = GAME_CONFIG.SEGMENTS_PER_PLATFORM;
  const segmentAngle = (Math.PI * 2) / segmentCount;
  
  // Determine gap position (1-2 segments gap)
  const gapSize = Math.random() < 0.5 
    ? GAME_CONFIG.MIN_GAP_SEGMENTS 
    : GAME_CONFIG.MAX_GAP_SEGMENTS;
  const gapStart = Math.floor(Math.random() * segmentCount);
  
  // Pick a color for this platform level
  const colorIndex = level % GAME_CONFIG.PLATFORM_COLORS.length;
  const platformColor = GAME_CONFIG.PLATFORM_COLORS[colorIndex];
  
  for (let i = 0; i < segmentCount; i++) {
    const isGap = isInGap(i, gapStart, gapSize, segmentCount);
    
    if (!isGap) {
      // Chance for danger segment (increases with level)
      const dangerChance = Math.min(GAME_CONFIG.DANGER_CHANCE + (level * 0.005), 0.4);
      const isDanger = Math.random() < dangerChance && level > 2;
      
      segments.push({
        startAngle: i * segmentAngle,
        endAngle: (i + 1) * segmentAngle,
        isDanger,
        color: isDanger ? GAME_CONFIG.DANGER_COLOR_1 : platformColor,
      });
    }
  }
  
  return {
    id: level,
    level,
    segments,
    y: -level * GAME_CONFIG.PLATFORM_GAP,
  };
}

function isInGap(index: number, gapStart: number, gapSize: number, total: number): boolean {
  for (let g = 0; g < gapSize; g++) {
    if (index === (gapStart + g) % total) return true;
  }
  return false;
}

export function updateBall(ball: Ball, deltaTime: number): Ball {
  const newVelocityY = Math.max(
    ball.velocityY + GAME_CONFIG.GRAVITY * deltaTime,
    GAME_CONFIG.TERMINAL_VELOCITY
  );
  
  return {
    ...ball,
    y: ball.y + newVelocityY * deltaTime,
    velocityY: newVelocityY,
  };
}

export function checkPlatformCollision(
  ball: Ball,
  platform: Platform,
  towerRotation: number
): { hit: boolean; isDanger: boolean; passedThrough: boolean } {
  const ballBottom = ball.y - ball.radius;
  const platformTop = platform.y + GAME_CONFIG.PLATFORM_HEIGHT / 2;
  const platformBottom = platform.y - GAME_CONFIG.PLATFORM_HEIGHT / 2;
  
  // Check if ball is at platform level
  if (ballBottom <= platformTop && ballBottom >= platformBottom - 0.1) {
    // Get ball's angle relative to tower rotation
    const ballAngle = normalizeAngle(-towerRotation);
    
    // Check each segment
    for (const segment of platform.segments) {
      const startAngle = normalizeAngle(segment.startAngle);
      const endAngle = normalizeAngle(segment.endAngle);
      
      if (isAngleInRange(ballAngle, startAngle, endAngle)) {
        return { hit: true, isDanger: segment.isDanger, passedThrough: false };
      }
    }
    
    // Ball is in a gap - passed through
    return { hit: false, isDanger: false, passedThrough: true };
  }
  
  return { hit: false, isDanger: false, passedThrough: false };
}

function normalizeAngle(angle: number): number {
  while (angle < 0) angle += Math.PI * 2;
  while (angle >= Math.PI * 2) angle -= Math.PI * 2;
  return angle;
}

function isAngleInRange(angle: number, start: number, end: number): boolean {
  angle = normalizeAngle(angle);
  start = normalizeAngle(start);
  end = normalizeAngle(end);
  
  if (start <= end) {
    return angle >= start && angle < end;
  } else {
    return angle >= start || angle < end;
  }
}

export function bounceBall(ball: Ball): Ball {
  return {
    ...ball,
    velocityY: GAME_CONFIG.BOUNCE_VELOCITY,
  };
}

export function saveBestScore(score: number): void {
  const currentBest = parseInt(localStorage.getItem('helixBestScore') || '0', 10);
  if (score > currentBest) {
    localStorage.setItem('helixBestScore', score.toString());
  }
}
