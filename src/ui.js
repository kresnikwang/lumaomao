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

    // Custom Modal state
    this.modal = {
      visible: false,
      title: '',
      content: '',
      onConfirm: null,
      onCancel: null
    };
  }

  showModal(title, content, onConfirm, onCancel) {
    this.modal.visible = true;
    this.modal.title = title;
    this.modal.content = content;
    this.modal.onConfirm = onConfirm;
    this.modal.onCancel = onCancel;
  }

  hideModal() {
    this.modal.visible = false;
  }

  checkModalClick(x, y) {
    if (!this.modal.visible) return false;

    const modalW = 280;
    const modalH = 200;
    const modalX = (this.width - modalW) / 2;
    const modalY = (this.height - modalH) / 2;

    const btnW = 100;
    const btnH = 40;
    const btnY = modalY + modalH - 60;

    const cancelX = modalX + 20;
    const confirmX = modalX + modalW - btnW - 20;

    // Check cancel
    if (x >= cancelX && x <= cancelX + btnW && y >= btnY && y <= btnY + btnH) {
      if (this.modal.onCancel) this.modal.onCancel();
      this.hideModal();
      return true;
    }

    // Check confirm
    if (x >= confirmX && x <= confirmX + btnW && y >= btnY && y <= btnY + btnH) {
      if (this.modal.onConfirm) this.modal.onConfirm();
      this.hideModal();
      return true;
    }

    // If clicked inside modal but not buttons, consume event
    if (x >= modalX && x <= modalX + modalW && y >= modalY && y <= modalY + modalH) {
      return true;
    }

    return false; // Clicked outside modal
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
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(0, 0, this.width, this.height);

      // Warning icon
      if (this.warningImg && this.warningImg.width > 0) {
        ctx.drawImage(this.warningImg, this.width / 2 - 40, this.height / 2 - 140, 80, 80);
      }

      // Game Over Text
      const isTimeUp = extraInfo.isPetMode && extraInfo.timeRemaining === 0;
      ctx.textAlign = 'center';
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
      const r2 = 12;
      const x2 = this.width / 2 - 90, y2 = this.height / 2 + 100, w2 = 180, h2 = 50;
      ctx.moveTo(x2 + r2, y2);
      ctx.lineTo(x2 + w2 - r2, y2);
      ctx.quadraticCurveTo(x2 + w2, y2, x2 + w2, y2 + r2);
      ctx.lineTo(x2 + w2, y2 + h2 - r2);
      ctx.quadraticCurveTo(x2 + w2, y2 + h2, x2 + w2 - r2, y2 + h2);
      ctx.lineTo(x2 + r2, y2 + h2);
      ctx.quadraticCurveTo(x2, y2 + h2, x2, y2 + h2 - r2);
      ctx.lineTo(x2, y2 + r2);
      ctx.quadraticCurveTo(x2, y2, x2 + r2, y2);
      ctx.closePath();
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
    
    // Apply red flash on top of everything
    if (this.redFlashIntensity > 0) {
      ctx.fillStyle = `rgba(255, 0, 0, ${this.redFlashIntensity * 0.3})`;
      ctx.fillRect(0, 0, this.width, this.height);
    }

    // Render custom modal if visible
    if (this.modal.visible) {
      this.renderModal(ctx);
    }

    ctx.restore();
  }

  renderModal(ctx) {
    // Dim background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, this.width, this.height);

    const modalW = 280;
    const modalH = 200;
    const modalX = (this.width - modalW) / 2;
    const modalY = (this.height - modalH) / 2;

    // Modal background
    ctx.fillStyle = '#FFF8DC'; // Warm game-themed color instead of pure white
    this.roundRect(ctx, modalX, modalY, modalW, modalH, 15);
    ctx.fill();

    // Title
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(this.modal.title, this.width / 2, modalY + 45);

    // Content (multi-line simple support)
    ctx.fillStyle = '#666666';
    ctx.font = '16px Arial';
    const lines = this.modal.content.split('\n');
    lines.forEach((line, i) => {
      ctx.fillText(line, this.width / 2, modalY + 90 + i * 25);
    });

    // Buttons
    const btnW = 100;
    const btnH = 40;
    const btnY = modalY + modalH - 60;
    const cancelX = modalX + 20;
    const confirmX = modalX + modalW - btnW - 20;

    // Cancel Button
    ctx.fillStyle = '#EEEEEE';
    this.roundRect(ctx, cancelX, btnY, btnW, btnH, 8);
    ctx.fill();
    ctx.fillStyle = '#666666';
    ctx.font = '16px Arial';
    ctx.fillText('取消', cancelX + btnW / 2, btnY + 26);

    // Confirm Button
    ctx.fillStyle = '#FF9800';
    this.roundRect(ctx, confirmX, btnY, btnW, btnH, 8);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('看广告', confirmX + btnW / 2, btnY + 26);
  }
}