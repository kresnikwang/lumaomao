/**
 * Game Configuration Constants
 */
export const CONFIG = {
  // Screen and Layout
  CANVAS: {
    TARGET_FPS: 60,
  },
  
  // Cat Settings
  CAT: {
    WIDTH: 240,
    HEIGHT: 240,
    SCORE_THRESHOLD: 50, // Increase difficulty every 50 points
    PERFECT_WINDOW: 250, // ms after alert starts where stopping = perfect
    MAX_COMBO: 20,
    COMBO_WINDOW: 1500,  // ms to maintain combo
  },
  
  // Pet Mode Settings
  PET: {
    HAPPINESS_GAIN: 0.5,
    ANNOYED_THRESHOLD: 70,
    MAX_HAPPINESS: 100,
  },
  
  // Particle Settings
  PARTICLES: {
    MAX_COUNT: 100, // Maximum active particles
    FUR_SPAWN_CHANCE: 0.3,
  },
  
  // Colors
  COLORS: {
    PRIMARY: '#FF6B6B',
    SECONDARY: '#FFD700',
    SUCCESS: '#4CAF50',
    DANGER: '#FF4444',
    BACKGROUND: '#FFF8DC',
  }
};
