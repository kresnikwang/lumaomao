import { CONFIG } from './config.js';

export const CAT_STATE = {
  IDLE: 'IDLE',
  BRUSHING: 'BRUSHING',
  ALERT: 'ALERT',
  LOOKING: 'LOOKING',
  BITING: 'BITING'
};

import ImageCache from './imageCache.js';

export default class Cat {
  constructor(canvasWidth, canvasHeight) {
    // Cat takes up ~75% of screen area
    const targetArea = canvasWidth * canvasHeight * 0.75;
    const aspectRatio = 1; // square cat
    this.width = Math.floor(Math.sqrt(targetArea * aspectRatio));
    this.height = this.width;
    // Cap at 90% of screen dimensions
    this.width = Math.min(this.width, Math.floor(canvasWidth * 0.9));
    this.height = Math.min(this.height, Math.floor(canvasHeight * 0.85));
    this.x = (canvasWidth - this.width) / 2;
    this.y = (canvasHeight - this.height) / 2 + 20;
    this.state = CAT_STATE.IDLE;
    
    this.alertTimer = 0;
    this.lookTimer = 0;
    this.nextEventTimer = this.getNextEventDelay();
    
    // Combo system
    this.combo = 0;
    this.comboTimer = 0;
    this.maxCombo = 0;
    
    // Difficulty scaling
    this.difficultyLevel = 1;
    this.scoreThreshold = CONFIG.CAT.SCORE_THRESHOLD;
    
    // Perfect timing
    this.perfectWindow = CONFIG.CAT.PERFECT_WINDOW;
    this.alertStartTime = 0;
    this.perfectStops = 0;
    this.justGotPerfect = false;
    
    // Load images via cache
    this.images = {};
    this.imageLoaded = false;
    this.loadImages();
  }
  
  loadImages() {
    const imageNames = ['brush_idle', 'brush_happy', 'brush_alert', 'brush_looking', 'brush_bite'];
    let loadedCount = 0;
    
    imageNames.forEach(name => {
      ImageCache.load(`assets/images/${name}.png`).then(img => {
        this.images[name] = img;
        loadedCount++;
        if (loadedCount === imageNames.length) {
          this.imageLoaded = true;
        }
      }).catch(() => {
        console.warn(`Failed to load image: ${name}`);
        loadedCount++;
      });
    });
  }

  getNextEventDelay() {
    // Scale difficulty: faster alerts as level increases
    const baseMin = Math.max(800, 2000 - (this.difficultyLevel - 1) * 200);
    const baseMax = Math.max(1500, 5000 - (this.difficultyLevel - 1) * 300);
    return baseMin + Math.random() * (baseMax - baseMin);
  }

  getAlertDuration() {
    // Alert duration decreases with difficulty
    const base = 800 + Math.random() * 700;
    return Math.max(400, base - (this.difficultyLevel - 1) * 100);
  }

  getLookDuration() {
    // Looking duration increases with difficulty (more dangerous)
    const base = 1000 + Math.random() * 1500;
    return Math.min(3000, base + (this.difficultyLevel - 1) * 200);
  }

  updateDifficulty(score) {
    const newLevel = Math.floor(score / this.scoreThreshold) + 1;
    if (newLevel > this.difficultyLevel) {
      this.difficultyLevel = newLevel;
    }
  }

  update(dt, isBrushing, score = 0) {
    if (this.state === CAT_STATE.BITING) return;

    this.justGotPerfect = false;

    // Update difficulty based on score
    this.updateDifficulty(score);

    // Update combo timer
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.combo = 0;
      }
    }

    if (this.state === CAT_STATE.IDLE || this.state === CAT_STATE.BRUSHING) {
      if (isBrushing) {
        this.state = CAT_STATE.BRUSHING;
        // Maintain combo while brushing
        this.comboTimer = CONFIG.CAT.COMBO_WINDOW;
      } else {
        this.state = CAT_STATE.IDLE;
      }

      this.nextEventTimer -= dt;
      if (this.nextEventTimer <= 0) {
        this.state = CAT_STATE.ALERT;
        this.alertTimer = this.getAlertDuration();
        this.alertStartTime = Date.now();
      }
    } else if (this.state === CAT_STATE.ALERT) {
      this.alertTimer -= dt;
      
      // Check for perfect stop: player stopped brushing right after alert
      if (!isBrushing && this.alertStartTime > 0) {
        const elapsed = Date.now() - this.alertStartTime;
        if (elapsed < this.perfectWindow) {
          this.perfectStops++;
          this.combo = Math.min(this.combo + 2, CONFIG.CAT.MAX_COMBO); // Perfect gives +2 combo
          this.comboTimer = 2000;
          this.justGotPerfect = true;
        }
        this.alertStartTime = 0; // Reset to prevent multiple triggers
      }
      
      if (this.alertTimer <= 0) {
        this.state = CAT_STATE.LOOKING;
        this.lookTimer = this.getLookDuration();
      }
    } else if (this.state === CAT_STATE.LOOKING) {
      this.lookTimer -= dt;
      if (this.lookTimer <= 0) {
        this.state = CAT_STATE.IDLE;
        this.nextEventTimer = this.getNextEventDelay();
        // Successful survival gives combo
        this.combo = Math.min(this.combo + 1, CONFIG.CAT.MAX_COMBO);
        this.comboTimer = CONFIG.CAT.COMBO_WINDOW;
      }
    }
  }

  getScoreMultiplier() {
    // Combo multiplier: 1x at 0 combo, up to 5x at 20 combo
    return 1 + (this.combo * 0.2);
  }

  isPerfectStop() {
    return this.perfectStops > 0;
  }

  render(ctx) {
    ctx.save();
    
    // Map state to image name
    let imageName = 'brush_idle';
    switch (this.state) {
      case CAT_STATE.BRUSHING: imageName = 'brush_happy'; break;
      case CAT_STATE.ALERT: imageName = 'brush_alert'; break;
      case CAT_STATE.LOOKING: imageName = 'brush_looking'; break;
      case CAT_STATE.BITING: imageName = 'brush_bite'; break;
    }
    
    const img = this.images[imageName];
    if (img && img.width > 0) {
      if (imageName === 'brush_idle') {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.scale(-1, 1);
        ctx.drawImage(img, -this.width / 2, -this.height / 2, this.width, this.height);
        ctx.restore();
      } else {
        ctx.drawImage(img, this.x, this.y, this.width, this.height);
      }
    } else {
      // Fallback: draw colored rectangle
      let color = '#CCCCCC';
      switch (this.state) {
        case CAT_STATE.BRUSHING: color = '#99FF99'; break;
        case CAT_STATE.ALERT: color = '#FFFF99'; break;
        case CAT_STATE.LOOKING: color = '#FF9999'; break;
        case CAT_STATE.BITING: color = '#333333'; break;
      }
      ctx.fillStyle = color;
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    // Draw combo indicator
    if (this.combo > 1) {
      ctx.fillStyle = '#FF6B6B';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${this.combo}x 连击!`, this.x + this.width / 2, this.y - 20);
    }

    // Draw difficulty level
    ctx.fillStyle = '#666666';
    ctx.font = '14px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`Lv.${this.difficultyLevel}`, this.x + this.width, this.y - 10);

    ctx.restore();
  }

  bite() {
    this.state = CAT_STATE.BITING;
    this.combo = 0;
  }

  reset() {
    this.state = CAT_STATE.IDLE;
    this.nextEventTimer = this.getNextEventDelay();
    this.combo = 0;
    this.comboTimer = 0;
    this.difficultyLevel = 1;
    this.perfectStops = 0;
    this.alertStartTime = 0;
  }
}