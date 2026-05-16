export const PET_STATE = {
  RELAXED: 'RELAXED',
  HAPPY: 'HAPPY',
  ANNOYED: 'ANNOYED',
  BITING: 'BITING'
};

export default class PetCat {
  constructor(canvasWidth, canvasHeight) {
    this.width = 240;
    this.height = 240;
    this.x = (canvasWidth - this.width) / 2;
    this.y = (canvasHeight - this.height) / 2 + 50;
    
    this.reset();
    
    // Load images
    this.images = {};
    this.loadImages();
  }
  
  loadImages() {
    const imageNames = ['pet_idle', 'pet_happy', 'pet_annoyed', 'pet_bite'];
    imageNames.forEach(name => {
      this.images[name] = wx.createImage();
      this.images[name].src = `assets/images/${name}.png`;
    });
  }

  reset() {
    this.state = PET_STATE.RELAXED;
    this.warnings = 0;
    this.happiness = 0;
    this.stateTimer = 0;
    
    // Define spots relative to cat center
    // Sweet spots (Head, Chin)
    this.sweetSpots = [
      { x: 0, y: -60, r: 50 }, // Head
      { x: 0, y: 40, r: 40 }   // Chin
    ];
    
    // Sensitive spots (Belly, Tail base) - Randomize slightly
    this.sensitiveSpots = [
      { x: -60, y: 60, r: 40 }, // Left Belly
      { x: 60, y: 60, r: 40 }   // Right Belly
    ];
  }

  update(dt, input) {
    if (this.state === PET_STATE.BITING) return;

    if (this.stateTimer > 0) {
      this.stateTimer -= dt;
      if (this.stateTimer <= 0) {
        this.state = PET_STATE.RELAXED;
      }
    }

    if (input.isTouching && input.isMoving) {
      this.checkPetting(input.lastX, input.lastY);
    }
  }

  checkPetting(px, py) {
    // Convert screen coordinates to cat-local coordinates (center is 0,0)
    const localX = px - (this.x + this.width / 2);
    const localY = py - (this.y + this.height / 2);

    // Check Sensitive Spots first
    for (let spot of this.sensitiveSpots) {
      const dist = Math.sqrt(localX * localX + localY * localY);
      if (dist < spot.r) {
        this.triggerWarning();
        return 'WARNING';
      }
    }

    // Check Sweet Spots
    for (let spot of this.sweetSpots) {
      const dist = Math.sqrt(localX * localX + localY * localY);
      if (dist < spot.r) {
        this.triggerHappy();
        return 'HAPPY';
      }
    }

    return 'NONE';
  }

  triggerWarning() {
    if (this.state === PET_STATE.ANNOYED) return; // Prevent multi-triggering in one frame
    
    this.warnings++;
    this.state = PET_STATE.ANNOYED;
    this.stateTimer = 1000; // Show annoyed face for 1s
    
    wx.vibrateShort();

    if (this.warnings >= 2) {
      this.state = PET_STATE.BITING;
      wx.vibrateLong();
    }
  }

  triggerHappy() {
    this.state = PET_STATE.HAPPY;
    this.stateTimer = 500;
    this.happiness += 1;
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

    // Draw Warnings UI
    this.drawWarnings(ctx);

    ctx.restore();
  }

  drawFace(ctx) {
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;

    ctx.fillStyle = '#000000';
    if (this.state === PET_STATE.HAPPY) {
      // Happy eyes ^ ^
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx - 40, cy - 20); ctx.lineTo(cx - 30, cy - 30); ctx.lineTo(cx - 20, cy - 20);
      ctx.moveTo(cx + 20, cy - 20); ctx.lineTo(cx + 30, cy - 30); ctx.lineTo(cx + 40, cy - 20);
      ctx.stroke();
      // Smile
      ctx.beginPath();
      ctx.arc(cx, cy + 10, 20, 0, Math.PI);
      ctx.stroke();
    } else if (this.state === PET_STATE.ANNOYED) {
      // Angry eyes > <
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx - 40, cy - 30); ctx.lineTo(cx - 20, cy - 20);
      ctx.moveTo(cx - 40, cy - 10); ctx.lineTo(cx - 20, cy - 20);
      ctx.moveTo(cx + 40, cy - 30); ctx.lineTo(cx + 20, cy - 20);
      ctx.moveTo(cx + 40, cy - 10); ctx.lineTo(cx + 20, cy - 20);
      ctx.stroke();
      // Flat mouth
      ctx.fillRect(cx - 20, cy + 20, 40, 4);
    } else if (this.state === PET_STATE.BITING) {
      // Biting - X X eyes
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx - 40, cy - 30); ctx.lineTo(cx - 20, cy - 10);
      ctx.moveTo(cx - 20, cy - 30); ctx.lineTo(cx - 40, cy - 10);
      ctx.moveTo(cx + 20, cy - 30); ctx.lineTo(cx + 40, cy - 10);
      ctx.moveTo(cx + 40, cy - 30); ctx.lineTo(cx + 20, cy - 10);
      ctx.stroke();
      // Open mouth
      ctx.fillStyle = '#FF0000';
      ctx.fillRect(cx - 20, cy + 10, 40, 20);
    } else {
      // Relaxed eyes - -
      ctx.fillRect(cx - 40, cy - 20, 25, 4);
      ctx.fillRect(cx + 15, cy - 20, 25, 4);
      // Small mouth
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
    ctx.fillText('警告次数', this.x + 110, this.y - 25);
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
