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
    const imageNames = ['bg_main', 'ui_logo', 'btn_brush', 'btn_pet', 'btn_rank'];
    imageNames.forEach(name => {
      this.images[name] = wx.createImage();
      this.images[name].src = `assets/images/${name}.png`;
    });
  }

  render(ctx) {
    ctx.save();
    
    // Background
    const bgImg = this.images['bg_main'];
    if (bgImg && bgImg.width > 0) {
      const imgRatio = bgImg.width / bgImg.height;
      const screenRatio = this.width / this.height;
      let drawW, drawH, drawX, drawY;

      if (imgRatio > screenRatio) {
        // Image is wider than screen: scale height to fit screen, crop sides
        drawH = this.height;
        drawW = bgImg.width * (this.height / bgImg.height);
        drawX = (this.width - drawW) / 2;
        drawY = 0;
      } else {
        // Image is taller than screen: scale width to fit screen, crop top/bottom
        drawW = this.width;
        drawH = bgImg.height * (this.width / bgImg.width);
        drawX = 0;
        drawY = (this.height - drawH) / 2;
      }
      ctx.drawImage(bgImg, drawX, drawY, drawW, drawH);
    } else {
      ctx.fillStyle = '#FFF8DC'; // Warmer background fallback
      ctx.fillRect(0, 0, this.width, this.height);
    }
    
    // Logo
    const logoImg = this.images['ui_logo'];
    if (logoImg && logoImg.width > 0) {
      const logoW = 320; // Slightly larger logo
      const logoH = 160;
      ctx.drawImage(logoImg, (this.width - logoW) / 2, 100, logoW, logoH);
    } else {
      ctx.fillStyle = '#333333';
      ctx.font = 'bold 40px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('撸猫猫中心', this.width / 2, this.height / 4);
    }
    
    // Move buttons up slightly since energy text is gone
    this.brushBtn.y = this.height / 2 - 40;
    this.petBtn.y = this.height / 2 + 80;
    this.rankBtn.y = this.height / 2 + 200;

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
