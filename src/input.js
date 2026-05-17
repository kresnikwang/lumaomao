export default class InputHandler {
  constructor() {
    this.isTouching = false;
    this.lastX = 0;
    this.lastY = 0;
    this.velocity = 0;
    this.isMoving = false;
    
    // Direction tracking
    this.direction = 'NONE';
    this.moveHistory = [];
    this.maxHistory = 5;
    
    // Smoothing
    this.smoothedVelocity = 0;
    this.velocitySmoothing = 0.3;
    
    // Minimum velocity threshold for brushing
    this.minBrushVelocity = 5;

    wx.onTouchStart(this.handleTouchStart.bind(this));
    wx.onTouchMove(this.handleTouchMove.bind(this));
    wx.onTouchEnd(this.handleTouchEnd.bind(this));
  }

  handleTouchStart(res) {
    const touch = res.touches[0];
    this.isTouching = true;
    this.lastX = touch.clientX;
    this.lastY = touch.clientY;
    this.velocity = 0;
    this.smoothedVelocity = 0;
    this.isMoving = false;
    this.direction = 'NONE';
    this.moveHistory = [];
  }

  handleTouchMove(res) {
    const touch = res.touches[0];
    const dx = touch.clientX - this.lastX;
    const dy = touch.clientY - this.lastY;
    
    // Calculate distance moved
    const distance = Math.sqrt(dx * dx + dy * dy);
    this.velocity = distance;
    
    // Smooth velocity
    this.smoothedVelocity = this.smoothedVelocity * (1 - this.velocitySmoothing) + distance * this.velocitySmoothing;
    
    // Track direction
    if (distance > 2) {
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      
      if (absDy > absDx && dy < 0) {
        this.direction = 'UP';
      } else if (absDy > absDx && dy > 0) {
        this.direction = 'DOWN';
      } else if (absDx > absDy && dx < 0) {
        this.direction = 'LEFT';
      } else if (absDx > absDy && dx > 0) {
        this.direction = 'RIGHT';
      }
      
      // Add to history
      this.moveHistory.push({
        x: touch.clientX,
        y: touch.clientY,
        direction: this.direction,
        time: Date.now()
      });
      
      // Keep only recent history
      if (this.moveHistory.length > this.maxHistory) {
        this.moveHistory.shift();
      }
    }
    
    this.lastX = touch.clientX;
    this.lastY = touch.clientY;
    this.isMoving = true;
  }

  handleTouchEnd() {
    this.isTouching = false;
    this.velocity = 0;
    this.smoothedVelocity = 0;
    this.isMoving = false;
    this.direction = 'NONE';
    this.moveHistory = [];
  }

  update() {
    // Decay velocity if not moving to avoid sticky score
    if (!this.isMoving) {
      this.velocity = 0;
      this.smoothedVelocity *= 0.8;
    }
    this.isMoving = false; // Reset for next frame
  }
  
  // Check if brushing velocity exceeds minimum threshold
  isBrushing() {
    return this.isTouching && this.smoothedVelocity > this.minBrushVelocity;
  }
  
  // Check if brushing velocity exceeds minimum threshold
  isBrushing() {
    return this.isTouching && this.smoothedVelocity > this.minBrushVelocity;
  }
  
  // Check if brushing velocity exceeds minimum threshold
  isBrushing() {
    return this.isTouching && this.smoothedVelocity > this.minBrushVelocity;
  }
  
  getDominantDirection() {
    if (this.moveHistory.length === 0) return 'NONE';
    
    const counts = {};
    this.moveHistory.forEach(m => {
      counts[m.direction] = (counts[m.direction] || 0) + 1;
    });
    
    let maxDir = 'NONE';
    let maxCount = 0;
    for (let dir in counts) {
      if (counts[dir] > maxCount) {
        maxCount = counts[dir];
        maxDir = dir;
      }
    }
    
    return maxDir;
  }
}