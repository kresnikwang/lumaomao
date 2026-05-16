export default class InputHandler {
  constructor() {
    this.isTouching = false;
    this.lastX = 0;
    this.lastY = 0;
    this.velocity = 0;
    this.isMoving = false;

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
    this.isMoving = false;
  }

  handleTouchMove(res) {
    const touch = res.touches[0];
    const dx = touch.clientX - this.lastX;
    const dy = touch.clientY - this.lastY;
    
    // Calculate distance moved
    const distance = Math.sqrt(dx * dx + dy * dy);
    this.velocity = distance; // Use distance as instantaneous velocity for scoring
    
    this.lastX = touch.clientX;
    this.lastY = touch.clientY;
    this.isMoving = true;
  }

  handleTouchEnd() {
    this.isTouching = false;
    this.velocity = 0;
    this.isMoving = false;
  }

  update() {
    // Decay velocity if not moving to avoid sticky score
    if (!this.isMoving) {
      this.velocity = 0;
    }
    this.isMoving = false; // Reset for next frame
  }
}
