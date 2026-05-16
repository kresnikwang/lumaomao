export default class Leaderboard {
  constructor(canvasWidth, canvasHeight) {
    this.width = canvasWidth;
    this.height = canvasHeight;
    this.backBtn = {
      x: 20,
      y: 50,
      width: 90,
      height: 45,
      label: '返回'
    };
    
    // Load trophy icon
    this.trophyImg = wx.createImage();
    this.trophyImg.src = 'assets/images/btn_rank.png';
  }

  render(ctx, data) {
    ctx.save();
    
    // Semi-transparent background overlay
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fillRect(20, 120, this.width - 40, this.height - 180);
    
    // Title with trophy icon
    if (this.trophyImg && this.trophyImg.width > 0) {
      ctx.drawImage(this.trophyImg, this.width / 2 - 30, 70, 60, 30);
    }
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('排行榜', this.width / 2, 130);
    ctx.font = '18px Arial';
    ctx.fillStyle = '#999999';
    ctx.fillText('(个人成绩)', this.width / 2, 158);
    
    // Headers
    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = '#666666';
    ctx.textAlign = 'left';
    ctx.fillText('项目', 60, 210);
    ctx.textAlign = 'center';
    ctx.fillText('总分', this.width / 2, 210);
    ctx.textAlign = 'right';
    ctx.fillText('最高分', this.width - 60, 210);
    
    // Rows
    ctx.fillStyle = '#333333';
    data.forEach((item, index) => {
      const y = 270 + index * 80;
      
      // Row background
      if (index % 2 === 0) {
        ctx.fillStyle = 'rgba(255, 200, 150, 0.2)';
        ctx.fillRect(40, y - 35, this.width - 80, 60);
      }
      
      ctx.fillStyle = '#333333';
      ctx.font = 'bold 22px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(item.name, 60, y);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#FF6B6B';
      ctx.fillText(item.total, this.width / 2, y);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#4CAF50';
      ctx.fillText(item.high, this.width - 60, y);
      
      // Line
      ctx.strokeStyle = '#EEEEEE';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(50, y + 25);
      ctx.lineTo(this.width - 50, y + 25);
      ctx.stroke();
    });

    // Back Button
    ctx.fillStyle = '#FF9800';
    ctx.beginPath();
    ctx.roundRect(this.backBtn.x, this.backBtn.y, this.backBtn.width, this.backBtn.height, 10);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(this.backBtn.label, this.backBtn.x + this.backBtn.width / 2, this.backBtn.y + 30);
    
    ctx.restore();
  }

  checkClick(x, y) {
    if (x >= this.backBtn.x && x <= this.backBtn.x + this.backBtn.width &&
        y >= this.backBtn.y && y <= this.backBtn.y + this.backBtn.height) {
      return 'BACK';
    }
    return null;
  }
}
