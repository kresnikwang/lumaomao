export default class UI {
  constructor(canvasWidth, canvasHeight) {
    this.width = canvasWidth;
    this.height = canvasHeight;
    
    // Load warning icon
    this.warningImg = wx.createImage();
    this.warningImg.src = 'assets/images/icon_warning.png';
    
    // Floating texts for score feedback
    this.floatingTexts = [];
    
    // Screen shake effect
    this.shakeIntensity = 0;
    this.shakeDecay = 0.9;
  }

  addFloatingText(text, x, y, color = '#FFD700', size = 24) {
    this.floatingTexts.push({
      text,
      x,
      y,
      color,
      size,
      life: 1.0,
      decay: 0.02
    });
  }

  triggerShake(intensity = 10) {
    this.shakeIntensity = intensity;
  }

  updateFloatingTexts() {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= ft.decay;
      ft.y -= 1; // Float upward
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
    
    // Decay shake
    this.shakeIntensity *= this.shakeDecay;
    if (this.shakeIntensity < 0.5) this.shakeIntensity = 0;
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
    
    // Apply screen shake
    const shake = this.getShakeOffset();
    ctx.translate(shake.x, shake.y);
    
    // Update floating texts
    this.updateFloatingTexts();
    
    // Draw Score with background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.roundRect(this.width / 2 - 80, 15, 160, 45, 10);
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
    
    // Draw floating texts
    this.floatingTexts.forEach(ft => {
      ctx.globalAlpha = ft.life;
      ctx.fillStyle = ft.color;
      ctx.font = `bold ${ft.size}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
    });
    ctx.globalAlpha = 1.0;

    if (gameState === 'GAMEOVER' || gameState === 'PET_GAMEOVER') {
      // Semi-transparent overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(0, 0, this.width, this.height);

      // Warning icon
      if (this.warningImg && this.warningImg.width > 0) {
        ctx.drawImage(this.warningImg, this.width / 2 - 40, this.height / 2 - 140, 80, 80);
      }

      // Game Over Text
      const isTimeUp = extraInfo.isPetMode && extraInfo.timeRemaining === 0;
      ctx.fillStyle = '#FF4444';
      ctx.font = 'bold 52px Arial';
      ctx.fillText(isTimeUp ? '时间到!' : '被咬了!', this.width / 2, this.height / 2 - 30);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '22px Arial';
      ctx.fillText('点击屏幕重新开始', this.width / 2, this.height / 2 + 30);
      
      // Show final score
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 28px Arial';
      ctx.fillText(`最终得分: ${Math.floor(score)}`, this.width / 2, this.height / 2 + 70);

      // Back to home button
      ctx.fillStyle = '#FF9800';
      ctx.beginPath();
      ctx.roundRect(this.width / 2 - 90, this.height / 2 + 100, 180, 50, 12);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 22px Arial';
      ctx.fillText('返回首页', this.width / 2, this.height / 2 + 133);
      
      this.backBtnRect = {
        x: this.width / 2 - 90,
        y: this.height / 2 + 100,
        width: 180,
        height: 50
      };
    }

    ctx.restore();
  }
}