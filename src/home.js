export default class Home {
  constructor(canvasWidth, canvasHeight) {
    this.width = canvasWidth;
    this.height = canvasHeight;

    // ─── Cat Breed Carousel ───
    this.catBreeds = [
      { id: 'american_shorthair',  name: '美短', color: '#5B8DEF', accent: '#3A6FD4' },
      { id: 'british_shorthair',  name: '英短', color: '#6B7DB3', accent: '#4A5C92' },
      { id: 'tabby',              name: '狸花', color: '#5080A0', accent: '#305F7F' },
      { id: 'orange_tabby',       name: '大橘', color: '#4A90D9', accent: '#2A70B8' },
      { id: 'siamese',            name: '暹罗', color: '#7B9ECE', accent: '#5A7DAD' },
    ];
    this.selectedCatIndex = 0;

    // Carousel layout (larger boxes)
    this.carouselY = 200;
    this.carouselH = 140;
    this.catBoxW = 100;
    this.catBoxH = 120;

    // ─── Button Layout (2x2 grid) ───
    const btnW = 145;
    const btnH = 64;
    const gapX = 16;
    const gapY = 12;
    const totalW = btnW * 2 + gapX;
    const startX = (this.width - totalW) / 2;
    const startY = 390;

    this.brushBtn = {
      x: startX, y: startY,
      width: btnW, height: btnH,
      label: '梳毛毛', icon: 'btn_brush'
    };
    this.petBtn = {
      x: startX + btnW + gapX, y: startY,
      width: btnW, height: btnH,
      label: '摸猫猫', icon: 'btn_pet'
    };
    this.nailBtn = {
      x: startX, y: startY + btnH + gapY,
      width: btnW, height: btnH,
      label: '剪指甲', icon: null  // no dedicated icon yet
    };
    this.rankBtn = {
      x: startX + btnW + gapX, y: startY + btnH + gapY,
      width: btnW, height: btnH,
      label: '排行榜', icon: 'btn_rank'
    };

    // ─── Swipe tracking ───
    this.swipeStartX = 0;
    this.swipeOffset = 0;
    this.isSwiping = false;

    // ─── Load images ───
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

  getSelectedCat() {
    return this.catBreeds[this.selectedCatIndex];
  }

  // ─── Carousel swipe handling ───
  handleSwipeStart(x) {
    this.swipeStartX = x;
    this.swipeOffset = 0;
    this.isSwiping = true;
  }

  handleSwipeMove(x) {
    if (!this.isSwiping) return;
    this.swipeOffset = x - this.swipeStartX;
  }

  handleSwipeEnd() {
    if (!this.isSwiping) return;
    const threshold = 40;
    if (this.swipeOffset < -threshold && this.selectedCatIndex < this.catBreeds.length - 1) {
      this.selectedCatIndex++;
    } else if (this.swipeOffset > threshold && this.selectedCatIndex > 0) {
      this.selectedCatIndex--;
    }
    this.swipeOffset = 0;
    this.isSwiping = false;
  }

  isInCarousel(x, y) {
    return y >= this.carouselY && y <= this.carouselY + this.carouselH;
  }

  // ─── Render ───
  render(ctx) {
    ctx.save();

    // Background
    const bgImg = this.images['bg_main'];
    if (bgImg && bgImg.width > 0) {
      const imgRatio = bgImg.width / bgImg.height;
      const screenRatio = this.width / this.height;
      let drawW, drawH, drawX, drawY;
      if (imgRatio > screenRatio) {
        drawH = this.height;
        drawW = bgImg.width * (this.height / bgImg.height);
        drawX = (this.width - drawW) / 2;
        drawY = 0;
      } else {
        drawW = this.width;
        drawH = bgImg.height * (this.width / bgImg.width);
        drawX = 0;
        drawY = (this.height - drawH) / 2;
      }
      ctx.drawImage(bgImg, drawX, drawY, drawW, drawH);
    } else {
      ctx.fillStyle = '#FFF8DC';
      ctx.fillRect(0, 0, this.width, this.height);
    }

    // Logo
    const logoImg = this.images['ui_logo'];
    const logoSize = 90;
    const logoY = 50;
    if (logoImg && logoImg.width > 0) {
      ctx.drawImage(logoImg, (this.width - logoSize) / 2, logoY, logoSize, logoSize);
    }

    // Title (tighter)
    ctx.fillStyle = '#FF9800';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#FFFFFF';
    ctx.strokeText('手速吸猫王', this.width / 2, logoY + logoSize + 36);
    ctx.fillText('手速吸猫王', this.width / 2, logoY + logoSize + 36);

    // ─── Cat Carousel ───
    this.renderCarousel(ctx);

    // ─── Buttons ───
    this.drawButton(ctx, this.brushBtn);
    this.drawButton(ctx, this.petBtn);
    this.drawButton(ctx, this.nailBtn);
    this.drawButton(ctx, this.rankBtn);

    // Subtitle below buttons
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.font = '13px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('选好猫猫，开始吸！', this.width / 2, this.rankBtn.y + this.rankBtn.height + 24);

    ctx.restore();
  }

  renderCarousel(ctx) {
    const centerX = this.width / 2;
    const catY = this.carouselY;
    const totalCats = this.catBreeds.length;

    // "选择猫猫" label
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🐱 选择你的猫猫', centerX, catY - 6);

    // Draw visible cats (up to 3 at a time)
    const spacing = 135;
    const visibleRadius = 1; // show 1 cat left + center + 1 cat right

    for (let i = -visibleRadius; i <= visibleRadius; i++) {
      const idx = this.selectedCatIndex + i;
      if (idx < 0 || idx >= totalCats) continue;

      const cat = this.catBreeds[idx];
      const bx = centerX + i * spacing - this.catBoxW / 2;
      const by = catY + 10;
      const isSelected = i === 0;

      // Shadow for selected
      if (isSelected) {
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        this.roundRect(ctx, bx - 3, by - 3, this.catBoxW + 6, this.catBoxH + 16, 14);
        ctx.fill();
      }

      // Cat box
      ctx.lineWidth = isSelected ? 3 : 1.5;
      ctx.strokeStyle = isSelected ? '#FF9800' : 'rgba(180,200,220,0.6)';

      // Blue placeholder gradient
      const grad = ctx.createLinearGradient(bx, by, bx, by + this.catBoxH);
      const alpha = isSelected ? 0.9 : 0.5;
      grad.addColorStop(0, cat.color);
      grad.addColorStop(1, cat.accent);
      ctx.fillStyle = grad;
      this.roundRect(ctx, bx, by, this.catBoxW, this.catBoxH, 14);
      ctx.fill();
      ctx.stroke();

      // Cat face placeholder (circle)
      if (isSelected) {
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(bx + this.catBoxW / 2, by + 42, 26, 0, Math.PI * 2);
        ctx.fill();
        // Eyes
        ctx.fillStyle = '#333';
        ctx.beginPath(); ctx.arc(bx + this.catBoxW / 2 - 9, by + 36, 4.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(bx + this.catBoxW / 2 + 9, by + 36, 4.5, 0, Math.PI * 2); ctx.fill();
        // Nose
        ctx.fillStyle = '#FF9999';
        ctx.beginPath();
        ctx.moveTo(bx + this.catBoxW / 2, by + 42);
        ctx.lineTo(bx + this.catBoxW / 2 - 5, by + 48);
        ctx.lineTo(bx + this.catBoxW / 2 + 5, by + 48);
        ctx.closePath();
        ctx.fill();
        // Ears
        ctx.fillStyle = cat.accent;
        ctx.beginPath(); ctx.moveTo(bx + 20, by + 10); ctx.lineTo(bx + 30, by - 6); ctx.lineTo(bx + 40, by + 14); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(bx + this.catBoxW - 20, by + 10); ctx.lineTo(bx + this.catBoxW - 30, by - 6); ctx.lineTo(bx + this.catBoxW - 40, by + 14); ctx.closePath(); ctx.fill();
        // Whiskers
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(bx + this.catBoxW / 2 - 5, by + 45); ctx.lineTo(bx + this.catBoxW / 2 - 26, by + 40); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bx + this.catBoxW / 2 - 5, by + 48); ctx.lineTo(bx + this.catBoxW / 2 - 26, by + 50); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bx + this.catBoxW / 2 + 5, by + 45); ctx.lineTo(bx + this.catBoxW / 2 + 26, by + 40); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bx + this.catBoxW / 2 + 5, by + 48); ctx.lineTo(bx + this.catBoxW / 2 + 26, by + 50); ctx.stroke();
      } else {
        // Simple placeholder for non-selected cats
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.beginPath();
        ctx.arc(bx + this.catBoxW / 2, by + 42, 22, 0, Math.PI * 2);
        ctx.fill();
        // Simple face
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath(); ctx.arc(bx + this.catBoxW / 2 - 7, by + 36, 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(bx + this.catBoxW / 2 + 7, by + 36, 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(bx + this.catBoxW / 2, by + 46, 2.5, 0, Math.PI * 2); ctx.fill();
      }

      // Breed name
      ctx.fillStyle = isSelected ? '#FF6600' : 'rgba(255,255,255,0.75)';
      ctx.font = isSelected ? 'bold 13px Arial' : '11px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(cat.name, bx + this.catBoxW / 2, by + this.catBoxH + 13);

      // Selection dot indicator
      if (isSelected) {
        ctx.fillStyle = '#FF9800';
        ctx.beginPath();
        ctx.arc(bx + this.catBoxW / 2, by + this.catBoxH + 22, 4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = 'rgba(180,180,180,0.5)';
        ctx.beginPath();
        ctx.arc(bx + this.catBoxW / 2, by + this.catBoxH + 22, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Arrow hints
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '22px Arial';
    ctx.textAlign = 'center';
    if (this.selectedCatIndex > 0) {
      ctx.fillText('◀', centerX - 160, catY + 68);
    }
    if (this.selectedCatIndex < totalCats - 1) {
      ctx.fillText('▶', centerX + 160, catY + 68);
    }
  }

  drawButton(ctx, btn) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    this.roundRect(ctx, btn.x, btn.y, btn.width, btn.height, 18);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#FFCC88';
    ctx.stroke();

    // Icon (if available)
    if (btn.icon && this.images[btn.icon] && this.images[btn.icon].width > 0) {
      const iconSize = 38;
      const iconX = btn.x + 10;
      const iconY = btn.y + (btn.height - iconSize) / 2;
      ctx.drawImage(this.images[btn.icon], iconX, iconY, iconSize, iconSize);
    } else {
      // Blue placeholder icon for nail button
      ctx.fillStyle = '#5B9BD5';
      this.roundRect(ctx, btn.x + 10, btn.y + (btn.height - 38) / 2, 38, 38, 8);
      ctx.fill();
      // Nail clipper icon
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('✂', btn.x + 10 + 19, btn.y + btn.height / 2);
    }

    // Label
    ctx.fillStyle = '#FF9800';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(btn.label, btn.x + btn.width / 2 + 14, btn.y + btn.height / 2);
  }

  roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
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
  }

  checkClick(x, y) {
    if (this.isPointInRect(x, y, this.brushBtn)) return 'BRUSH';
    if (this.isPointInRect(x, y, this.petBtn))    return 'PET';
    if (this.isPointInRect(x, y, this.nailBtn))   return 'NAIL';
    if (this.isPointInRect(x, y, this.rankBtn))   return 'RANK';
    return null;
  }

  isPointInRect(px, py, rect) {
    return px >= rect.x && px <= rect.x + rect.width &&
           py >= rect.y && py <= rect.y + rect.height;
  }
}
