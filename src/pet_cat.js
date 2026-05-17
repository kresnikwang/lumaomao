import { CONFIG } from './config.js';

export const PET_STATE = {
  RELAXED: 'RELAXED',
  HAPPY: 'HAPPY',
  ANNOYED: 'ANNOYED',
  BITING: 'BITING'
};

export default class PetCat {
  constructor(canvasWidth, canvasHeight) {
    // Cat takes up ~70% of screen area
    const targetArea = canvasWidth * canvasHeight * 0.7;
    const aspectRatio = 1; // square cat
    this.width = Math.floor(Math.sqrt(targetArea * aspectRatio));
    this.height = this.width;
    // Cap at 90% of screen dimensions
    this.width = Math.min(this.width, Math.floor(canvasWidth * 0.9));
    this.height = Math.min(this.height, Math.floor(canvasHeight * 0.8));
    this.x = (canvasWidth - this.width) / 2;
    this.y = (canvasHeight - this.height) / 2 + 30;
    
    this.reset();
    
    // Load images
    this.images = {};
    this.imageLoaded = false;
    this.loadImages();
  }
  
  loadImages() {
    const imageNames = ['pet_idle', 'pet_happy', 'pet_annoyed', 'pet_bite'];
    let loadedCount = 0;
    
    imageNames.forEach(name => {
      this.images[name] = wx.createImage();
      this.images[name].onload = () => {
        loadedCount++;
        if (loadedCount === imageNames.length) {
          this.imageLoaded = true;
        }
      };
      this.images[name].onerror = () => {
        console.warn(`Failed to load image: ${name}`);
        loadedCount++;
      };
      this.images[name].src = `assets/images/${name}.png`;
    });
  }

  reset() {
    this.state = PET_STATE.RELAXED;
    this.warnings = 0;
    this.happiness = 0;
    this.stateTimer = 0;
    this.gameTime = 30000; // 30 seconds time limit
    this.timeRemaining = this.gameTime;
    
    // Randomize spots for each game
    this.randomizeSpots();
    
    // Petting direction tracking
    this.lastPetX = 0;
    this.lastPetY = 0;
    this.petDirection = 'NONE';
    this.directionScore = 0;
  }

  randomizeSpots() {
    // Sweet spots (Head, Chin) - slightly randomized positions
    const headOffset = (Math.random() - 0.5) * 30;
    const chinOffset = (Math.random() - 0.5) * 20;
    this.sweetSpots = [
      { x: headOffset, y: -60 + (Math.random() - 0.5) * 20, r: 45 + Math.random() * 10 },
      { x: chinOffset, y: 40 + (Math.random() - 0.5) * 15, r: 35 + Math.random() * 10 }
    ];
    
    // Sensitive spots (Belly areas) - randomized
    this.sensitiveSpots = [
      { x: -50 + (Math.random() - 0.5) * 30, y: 60 + (Math.random() - 0.5) * 20, r: 35 + Math.random() * 10 },
      { x: 50 + (Math.random() - 0.5) * 30, y: 60 + (Math.random() - 0.5) * 20, r: 35 + Math.random() * 10 }
    ];
  }

  update(dt, input) {
    if (this.state === PET_STATE.BITING) return;

    // Update game timer
    this.timeRemaining -= dt;
    if (this.timeRemaining <= 0) {
      this.timeRemaining = 0;
      this.state = PET_STATE.BITING; // Time's up - game over
      return;
    }

    if (this.stateTimer > 0) {
      this.stateTimer -= dt;
      if (this.stateTimer <= 0) {
        this.state = PET_STATE.RELAXED;
      }
    }

    if (input.isTouching && input.isMoving) {
      this.checkPetting(input.lastX, input.lastY, input.velocity);
    }
  }

  checkPetting(px, py, velocity) {
    // Convert screen coordinates to cat-local coordinates (center is 0,0)
    const localX = px - (this.x + this.width / 2);
    const localY = py - (this.y + this.height / 2);

    // Calculate petting direction
    if (this.lastPetX !== 0 || this.lastPetY !== 0) {
      const dx = px - this.lastPetX;
      const dy = py - this.lastPetY;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      
      if (absDy > absDx && dy < 0) {
        this.petDirection = 'UP';
      } else if (absDy > absDx && dy > 0) {
        this.petDirection = 'DOWN';
      } else if (absDx > absDy && dx < 0) {
        this.petDirection = 'LEFT';
      } else if (absDx > absDy && dx > 0) {
        this.petDirection = 'RIGHT';
      }
    }
    this.lastPetX = px;
    this.lastPetY = py;

    // Check Sensitive Spots first
    for (let spot of this.sensitiveSpots) {
      const dist = Math.sqrt((localX - spot.x) * (localX - spot.x) + (localY - spot.y) * (localY - spot.y));
      if (dist < spot.r) {
        // Direction penalty: horizontal strokes on belly are worse
        if (this.petDirection === 'LEFT' || this.petDirection === 'RIGHT') {
          this.triggerWarning(true); // Double penalty for wrong direction
        } else {
          this.triggerWarning(false);
        }
        return 'WARNING';
      }
    }

    // Check Sweet Spots
    for (let spot of this.sweetSpots) {
      const dist = Math.sqrt((localX - spot.x) * (localX - spot.x) + (localY - spot.y) * (localY - spot.y));
      if (dist < spot.r) {
        // Direction bonus: vertical strokes on head/chin are better
        const directionBonus = (this.petDirection === 'UP' || this.petDirection === 'DOWN') ? 2 : 1;
        const velocityBonus = Math.min(velocity * 0.1, 3);
        this.triggerHappy(directionBonus + velocityBonus);
        return 'HAPPY';
      }
    }

    return 'NONE';
  }

  triggerWarning(doublePenalty = false) {
    if (this.state === PET_STATE.ANNOYED) return;
    
    this.warnings += doublePenalty ? 2 : 1;
    this.state = PET_STATE.ANNOYED;
    this.stateTimer = 1000;
    
    wx.vibrateShort();

    if (this.warnings >= 2) {
      this.state = PET_STATE.BITING;
      wx.vibrateLong();
    }
  }

  triggerHappy(bonus = 1) {
    this.state = PET_STATE.HAPPY;
    this.stateTimer = 500;
    this.happiness += bonus;
    this.directionScore += bonus;
  }

  getTimeRemaining() {
    return Math.ceil(this.timeRemaining / 1000);
  }

  getAccuracy() {
    if (this.directionScore === 0) return 0;
    return Math.min(100, Math.floor((this.directionScore / (this.happiness + this.warnings * 2)) * 100));
  }

  render(ctx) {
    ctx.save();

    // Map state to image name
    let imageName = 'pet_idle';
    switch (this.state) {
      case PET_STATE.HAPPY: imageName = 'pet_happy'; break;
      case PET_STATE.ANNOYED: imageName = 'pet_annoyed'; break;
      case PET_STATE.BITING: imageName = 'pet_bite'; break;
    }
    
    const img = this.images[imageName];
    if (img && img.width > 0) {
      ctx.drawImage(img, this.x, this.y, this.width, this.height);
    } else {
      // Fallback: draw colored rectangle
      let color = '#FFCC88';
      if (this.state === PET_STATE.HAPPY) color = '#FFB347';
      if (this.state === PET_STATE.ANNOYED) color = '#FF6666';
      if (this.state === PET_STATE.BITING) color = '#333333';
      ctx.fillStyle = color;
      this.drawRoundedRect(ctx, this.x, this.y, this.width, this.height, 60);
      ctx.fill();
      this.drawFace(ctx);
    }

    // Draw spot indicators (subtle hints)
    this.drawSpotHints(ctx);

    // Draw Warnings UI
    this.drawWarnings(ctx);

    // Draw timer
    this.drawTimer(ctx);

    ctx.restore();
  }

  drawSpotHints(ctx) {
    // Draw subtle circles for sweet spots (very faint)
    ctx.globalAlpha = 0.15;
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 2;
    
    for (let spot of this.sweetSpots) {
      ctx.beginPath();
      ctx.arc(this.x + this.width / 2 + spot.x, this.y + this.height / 2 + spot.y, spot.r, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    ctx.globalAlpha = 1.0;
  }

  drawTimer(ctx) {
    const timeLeft = this.getTimeRemaining();
    const timerColor = timeLeft <= 5 ? '#FF0000' : (timeLeft <= 10 ? '#FF9800' : '#4CAF50');
    
    ctx.fillStyle = timerColor;
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`⏱ ${timeLeft}s`, this.x + this.width / 2, this.y - 50);
  }

  drawFace(ctx) {
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;

    ctx.fillStyle = '#000000';
    if (this.state === PET_STATE.HAPPY) {
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx - 40, cy - 20); ctx.lineTo(cx - 30, cy - 30); ctx.lineTo(cx - 20, cy - 20);
      ctx.moveTo(cx + 20, cy - 20); ctx.lineTo(cx + 30, cy - 30); ctx.lineTo(cx + 40, cy - 20);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy + 10, 20, 0, Math.PI);
      ctx.stroke();
    } else if (this.state === PET_STATE.ANNOYED) {
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx - 40, cy - 30); ctx.lineTo(cx - 20, cy - 20);
      ctx.moveTo(cx - 40, cy - 10); ctx.lineTo(cx - 20, cy - 20);
      ctx.moveTo(cx + 40, cy - 30); ctx.lineTo(cx + 20, cy - 20);
      ctx.moveTo(cx + 40, cy - 10); ctx.lineTo(cx + 20, cy - 20);
      ctx.stroke();
      ctx.fillRect(cx - 20, cy + 20, 40, 4);
    } else if (this.state === PET_STATE.BITING) {
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx - 40, cy - 30); ctx.lineTo(cx - 20, cy - 10);
      ctx.moveTo(cx - 20, cy - 30); ctx.lineTo(cx - 40, cy - 10);
      ctx.moveTo(cx + 20, cy - 30); ctx.lineTo(cx + 40, cy - 10);
      ctx.moveTo(cx + 40, cy - 30); ctx.lineTo(cx + 20, cy - 10);
      ctx.stroke();
      ctx.fillStyle = '#FF0000';
      ctx.fillRect(cx - 20, cy + 10, 40, 20);
    } else {
      ctx.fillRect(cx - 40, cy - 20, 25, 4);
      ctx.fillRect(cx + 15, cy - 20, 25, 4);
      ctx.beginPath();
      ctx.arc(cx, cy + 10, 10, 0.2 * Math.PI, 0.8 * Math.PI);
      ctx.stroke();
    }
  }

  drawWarnings(ctx) {
    for (let i = 0; i < 2; i++) {
      ctx.fillStyle = i < this.warnings ? '#FF0000' : '#CCCCCC';
      ctx.beginPath();
      ctx.arc(this.x + 40 + i * 40, this.y - 30, 10, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#666666';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('警告', this.x + 110, this.y - 25);
  }

  drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
}