export default class Home {
  constructor(canvasWidth, canvasHeight) {
    this.width = canvasWidth;
    this.height = canvasHeight;
    
    // Define button areas
    const btnWidth = 220;
    const btnHeight = 90;
    const centerX = this.width / 2 - btnWidth / 2;
    
    this.brushBtn = {
      x: centerX,
      y: this.height / 2 - 80,
      width: btnWidth,
      height: btnHeight,
      label: '梳毛毛'
    };
    
    this.petBtn = {
      x: centerX,
      y: this.height / 2 + 40,
      width: btnWidth,
      height: btnHeight,
      label: '摸猫猫'
    };

    this.rankBtn = {
      x: centerX,
      y: this.height / 2 + 160,
      width: btnWidth,
      height: btnHeight,
      label: '排行榜'
    };
    
    // Load images
    this.images = {};
    this.loadImages();
  }
  
  loadImages() {
    const imageNames = ['bg_main', 'ui_logo', 'btn_brush', 'btn_pet', 'btn_rank', 'icon_energy'];
    imageNames.forEach(name => {
      this.images[name] = wx.createImage();
      this.images[name].src = `assets/images/${name}.png`;
    });
  }

  render(ctx, chances) {
    ctx.save();
    
    // Background
    const bgImg = this.images['bg_main'];
    if (bgImg && bgImg.width > 0) {
      ctx.drawImage(bgImg, 0, 0, this.width, this.height);
    } else {
      ctx.fillStyle = '#F5F5F5';
      ctx.fillRect(0, 0, this.width, this.height);
    }
    
    // Logo
    const logoImg = this.images['ui_logo'];
    if (logoImg && logoImg.width > 0) {
      const logoW = 300;
      const logoH = 150;
      ctx.drawImage(logoImg, (this.width - logoW) / 2, 80, logoW, logoH);
    } else {
      ctx.fillStyle = '#333333';
      ctx.font = 'bold 36px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('撸猫猫中心', this.width / 2, this.height / 4);
    }

    // Chances with icon
    const energyImg = this.images['icon_energy'];
    if (energyImg && energyImg.width > 0) {
      ctx.drawImage(energyImg, this.width / 2 - 80, this.height / 4 + 40, 30, 30);
    }
    ctx.fillStyle = '#666666';
    ctx.font = 'bold 22px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`剩余次数: ${chances}`, this.width / 2 + 10, this.height / 4 + 62);
    
    // Buttons with images
    this.drawImageButton(ctx, this.brushBtn, 'btn_brush');
    this.drawImageButton(ctx, this.petBtn, 'btn_pet');
    this.drawImageButton(ctx, this.rankBtn, 'btn_rank');
    
    ctx.restore();
  }
  
  drawImageButton(ctx, btn, imageName) {
    const img = this.images[imageName];
    if (img && img.width > 0) {
      ctx.drawImage(img, btn.x, btn.y, btn.width, btn.height);
    } else {
      // Fallback
      ctx.fillStyle = '#4CAF50';
      ctx.fillRect(btn.x, btn.y, btn.width, btn.height);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(btn.label, btn.x + btn.width / 2, btn.y + btn.height / 2);
    }
  }



  roundRect(ctx, x, y, width, height, radius) {
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
  }

  checkClick(x, y) {
    if (this.isPointInRect(x, y, this.brushBtn)) {
      return 'BRUSH';
    }
    if (this.isPointInRect(x, y, this.petBtn)) {
      return 'PET';
    }
    if (this.isPointInRect(x, y, this.rankBtn)) {
      return 'RANK';
    }
    return null;
  }

  isPointInRect(px, py, rect) {
    return px >= rect.x && px <= rect.x + rect.width &&
           py >= rect.y && py <= rect.y + rect.height;
  }
}
