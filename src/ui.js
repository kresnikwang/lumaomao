export default class UI {
  constructor(canvasWidth, canvasHeight) {
    this.width = canvasWidth;
    this.height = canvasHeight;
    
    // Load warning icon
    this.warningImg = wx.createImage();
    this.warningImg.src = 'assets/images/icon_warning.png';
  }

  render(ctx, score, gameState) {
    ctx.save();
    
    // Draw Score with background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.roundRect(this.width / 2 - 80, 15, 160, 45, 10);
    ctx.fill();
    
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 26px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Score: ${Math.floor(score)}`, this.width / 2, 48);

    if (gameState === 'GAMEOVER') {
      // Semi-transparent overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(0, 0, this.width, this.height);

      // Warning icon
      if (this.warningImg && this.warningImg.width > 0) {
        ctx.drawImage(this.warningImg, this.width / 2 - 40, this.height / 2 - 140, 80, 80);
      }

      // Game Over Text
      ctx.fillStyle = '#FF4444';
      ctx.font = 'bold 52px Arial';
      ctx.fillText('被咬了!', this.width / 2, this.height / 2 - 30);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '22px Arial';
      ctx.fillText('点击屏幕重新开始', this.width / 2, this.height / 2 + 30);

      // Back to home button
      ctx.fillStyle = '#FF9800';
      ctx.beginPath();
      ctx.roundRect(this.width / 2 - 90, this.height / 2 + 80, 180, 50, 12);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 22px Arial';
      ctx.fillText('返回首页', this.width / 2, this.height / 2 + 113);
      
      this.backBtnRect = {
        x: this.width / 2 - 90,
        y: this.height / 2 + 80,
        width: 180,
        height: 50
      };
    }

    ctx.restore();
  }
}
