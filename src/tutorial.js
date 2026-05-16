/**
 * Tutorial system for first-time players
 */
export default class Tutorial {
  constructor(canvasWidth, canvasHeight) {
    this.width = canvasWidth;
    this.height = canvasHeight;
    this.step = 0;
    this.visible = false;
    this.gameType = null; // 'BRUSH' or 'PET'
    
    // Animation
    this.animationTime = 0;
    this.handX = 0;
    this.handY = 0;
    this.targetX = 0;
    this.targetY = 0;
    
    // Check if tutorial was shown
    this.shownKey = 'lumaomao_tutorial_shown';
    this.hasShown = wx.getStorageSync(this.shownKey) || {};
  }

  shouldShow(type) {
    return !this.hasShown[type];
  }

  start(type) {
    this.gameType = type;
    this.step = 0;
    this.visible = true;
    this.animationTime = 0;
    this.setupAnimation();
  }

  dismiss() {
    this.visible = false;
    this.hasShown[this.gameType] = true;
    wx.setStorageSync(this.shownKey, this.hasShown);
  }

  setupAnimation() {
    const centerX = this.width / 2;
    const centerY = this.height / 2 + 50;
    
    if (this.gameType === 'BRUSH') {
      // Hand brushing animation
      this.handX = centerX - 80;
      this.handY = centerY;
      this.targetX = centerX + 80;
      this.targetY = centerY;
    } else {
      // Hand petting animation (circular)
      this.handX = centerX;
      this.handY = centerY - 60;
    }
  }

  update(dt) {
    if (!this.visible) return;
    
    this.animationTime += dt;
    
    const centerX = this.width / 2;
    const centerY = this.height / 2 + 50;
    const t = (this.animationTime % 2000) / 2000; // 2 second loop
    
    if (this.gameType === 'BRUSH') {
      // Back and forth brushing motion
      const offset = Math.sin(t * Math.PI * 2) * 80;
      this.handX = centerX + offset;
      this.handY = centerY + Math.abs(Math.sin(t * Math.PI * 4)) * 10;
    } else {
      // Circular petting motion on head
      const angle = t * Math.PI * 2;
      const radius = 40;
      this.handX = centerX + Math.cos(angle) * radius;
      this.handY = centerY - 60 + Math.sin(angle) * radius * 0.5;
    }
  }

  render(ctx) {
    if (!this.visible) return;
    
    ctx.save();
    
    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, this.width, this.height);
    
    const centerX = this.width / 2;
    
    // Title
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('新手教程', centerX, 120);
    
    // Draw animated hand
    this.drawHand(ctx, this.handX, this.handY);
    
    // Instructions
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 22px Arial';
    
    if (this.gameType === 'BRUSH') {
      ctx.fillText('👆 快速来回滑动梳毛', centerX, this.height / 2 + 180);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '18px Arial';
      ctx.fillText('⚠️ 猫咪回头时立即停止！', centerX, this.height / 2 + 220);
      ctx.fillText('💡 黄色预警 → 红色危险 → 停止！', centerX, this.height / 2 + 250);
    } else {
      ctx.fillText('👆 在猫咪头部/下巴区域抚摸', centerX, this.height / 2 + 180);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '18px Arial';
      ctx.fillText('⚠️ 避开肚子区域！', centerX, this.height / 2 + 220);
      ctx.fillText('💡 上下滑动得分更高', centerX, this.height / 2 + 250);
    }
    
    // Continue button
    ctx.fillStyle = '#4CAF50';
    ctx.beginPath();
    ctx.roundRect(centerX - 80, this.height - 120, 160, 50, 12);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px Arial';
    ctx.fillText('知道了', centerX, this.height - 88);
    
    ctx.restore();
  }

  drawHand(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);
    
    // Hand shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.arc(3, 3, 25, 0, Math.PI * 2);
    ctx.fill();
    
    // Hand circle
    ctx.fillStyle = '#FFE0B2';
    ctx.beginPath();
    ctx.arc(0, 0, 25, 0, Math.PI * 2);
    ctx.fill();
    
    // Finger indicator
    ctx.fillStyle = '#FF9800';
    ctx.beginPath();
    ctx.arc(0, -5, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // Pulse effect
    const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;
    ctx.strokeStyle = `rgba(255, 152, 0, ${pulse})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 30 + pulse * 5, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.restore();
  }

  checkClick(x, y) {
    if (!this.visible) return false;
    
    const centerX = this.width / 2;
    const btnY = this.height - 120;
    
    if (x >= centerX - 80 && x <= centerX + 80 &&
        y >= btnY && y <= btnY + 50) {
      this.dismiss();
      return true;
    }
    return false;
  }
}
