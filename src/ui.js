export default class UI {
  constructor(canvasWidth, canvasHeight) {
    this.width = canvasWidth;
    this.height = canvasHeight;
    
    // Load warning icon
    this.warningImg = wx.createImage();
    this.warningImg.src = 'assets/images/icon_warning.png';
    
    // Screen shake effect
    this.shakeIntensity = 0;
    this.shakeDecay = 0.9;
    
    // Red flash effect
    this.redFlashIntensity = 0;
    this.redFlashDecay = 0.95;
  }

  drawBrushCursor(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);
    // Draw a cute transparent comb using canvas
    ctx.fillStyle = '#FF9800'; // Comb body
    this.roundRect(ctx, -25, -15, 50, 15, 5);
    ctx.fill();
    
    // Draw comb teeth
    ctx.fillStyle = '#E65100';
    for (let i = -20; i <= 20; i += 6) {
      ctx.fillRect(i, 0, 4, 18);
      // rounded tips
      ctx.beginPath();
      ctx.arc(i + 2, 18, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  roundRect(ctx, x, y, width, height, radius) {
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

  triggerShake(intensity = 10) {
    this.shakeIntensity = intensity;
  }

  triggerRedFlash() {
    this.redFlashIntensity = 1.0;
  }

  updateEffects() {
    // Decay shake
    this.shakeIntensity *= this.shakeDecay;
    if (this.shakeIntensity < 0.5) this.shakeIntensity = 0;
    
    // Decay red flash
    this.redFlashIntensity *= this.redFlashDecay;
    if (this.redFlashIntensity < 0.01) this.redFlashIntensity = 0;
  }

  getShakeOffset() {
    if (this.shakeIntensity === 0) return { x: 0, y: 0 };
    return {
      x: (Math.random() - 0.5) * this.shakeIntensity * 2,
      y: (Math.random() - 0.5) * this.shakeIntensity * 2
    };
  }

  render(ctx, score, gameState, extraInfo = {}) {
    ctx.save();
    
    // Update and apply effects
    this.updateEffects();
    
    // Apply screen shake
    const shake = this.getShakeOffset();
    ctx.translate(shake.x, shake.y);
    
    // Draw Score with background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    const r = 10;
    const x = this.width / 2 - 80, y = 15, w = 160, h = 45;
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 26px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Score: ${Math.floor(score)}`, this.width / 2, 48);
    
    // Draw combo indicator
    if (extraInfo.combo > 1) {
      ctx.fillStyle = '#FF6B6B';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${extraInfo.combo}x 连击!`, this.width / 2, 80);
    }
    
    // Draw difficulty level
    if (extraInfo.difficulty) {
      ctx.fillStyle = '#666666';
      ctx.font = '14px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(`Lv.${extraInfo.difficulty}`, this.width - 20, 30);
    }
    
    // Draw timer for pet mode
    if (extraInfo.isPetMode && extraInfo.timeRemaining !== undefined) {
      const timerColor = extraInfo.timeRemaining <= 5 ? '#FF0000' : (extraInfo.timeRemaining <= 10 ? '#FF9800' : '#4CAF50');
      ctx.fillStyle = timerColor;
      ctx.font = 'bold 22px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`⏱ ${extraInfo.timeRemaining}s`, 20, 30);
    }

    if (gameState === 'GAMEOVER' || gameState === 'PET_GAMEOVER') {
      // Semi-transparent overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, this.width, this.height);

      // Game Over Card
      const cardW = 300;
      const cardH = 340;
      const cardX = (this.width - cardW) / 2;
      const cardY = (this.height - cardH) / 2 - 20;

      // Card Background (warm theme)
      ctx.fillStyle = '#FFF8DC';
      this.roundRect(ctx, cardX, cardY, cardW, cardH, 20);
      ctx.fill();
      
      // Inner Border
      ctx.strokeStyle = '#FFCC88';
      ctx.lineWidth = 4;
      this.roundRect(ctx, cardX + 10, cardY + 10, cardW - 20, cardH - 20, 15);
      ctx.stroke();

      // Warning icon at the top of the card
      if (this.warningImg && this.warningImg.width > 0) {
        ctx.drawImage(this.warningImg, this.width / 2 - 35, cardY - 35, 70, 70);
      }

      // Game Over Text
      const isTimeUp = extraInfo.isPetMode && extraInfo.timeRemaining === 0;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#FF5252'; // Softer red
      ctx.font = 'bold 44px Arial';
      ctx.fillText(isTimeUp ? '时间到!' : '被咬了!', this.width / 2, cardY + 90);
      
      // Subtitle
      ctx.fillStyle = '#888888';
      ctx.font = '18px Arial';
      ctx.fillText('猫猫已经失去耐心了', this.width / 2, cardY + 130);
      
      // Divider
      ctx.beginPath();
      ctx.moveTo(cardX + 40, cardY + 150);
      ctx.lineTo(cardX + cardW - 40, cardY + 150);
      ctx.strokeStyle = '#E0E0E0';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Show final score
      ctx.fillStyle = '#FF9800'; // Orange
      ctx.font = 'bold 36px Arial';
      ctx.fillText(`得分: ${Math.floor(score)}`, this.width / 2, cardY + 210);

      // Back to home button
      ctx.fillStyle = '#FF9800';
      ctx.beginPath();
      const r2 = 12;
      const btnW = 200, btnH = 50;
      const btnX = this.width / 2 - btnW / 2;
      const btnY2 = cardY + 260;
      this.roundRect(ctx, btnX, btnY2, btnW, btnH, r2);
      ctx.fill();
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 22px Arial';
      ctx.fillText('返回首页', this.width / 2, btnY2 + 33);
      
      this.backBtnRect = {
        x: btnX,
        y: btnY2,
        width: btnW,
        height: btnH
      };
    }
    
    // Apply red flash on top of everything
    if (this.redFlashIntensity > 0) {
      ctx.fillStyle = `rgba(255, 0, 0, ${this.redFlashIntensity * 0.3})`;
      ctx.fillRect(0, 0, this.width, this.height);
    }

    ctx.restore();
  }
}