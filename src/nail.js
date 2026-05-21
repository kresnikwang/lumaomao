/**
 * Nail Clipping Game Mode
 * The cat is sleeping — clip its nails while it's not looking!
 * 8 nails total (4 left paw + 4 right paw)
 * Cat randomly wakes up. Clip during AWAKE = GAME OVER.
 */

export const NAIL_STATE = {
  SLEEPING: 'SLEEPING',   // Safe to clip
  WAKING: 'WAKING',       // Warning — still safe but hurry!
  AWAKE: 'AWAKE',         // Danger! Clip = game over
};

class NailGame {
  constructor(width, height) {
    this.width = width;
    this.height = height;

    // Cat position
    this.catX = width / 2;
    this.catY = 150;
    this.catW = 200;
    this.catH = 160;

    // Paws
    this.pawW = 140;
    this.pawH = 100;
    this.pawGap = 40;
    this.leftPawX = width / 2 - this.pawW - this.pawGap / 2;
    this.rightPawX = width / 2 + this.pawGap / 2;
    this.pawY = 340;

    // 8 nails (left paw 4, right paw 4)
    this.nails = this.createNails();

    // Game state
    this.catState = NAIL_STATE.SLEEPING;
    this.stateTimer = 0;
    this.nextWakeTime = this.randomSleepTime();
    this.wakingDuration = 1500;  // 1.5s warning window
    this.awakeDuration = 0;      // set when entering AWAKE
    this.minAwake = 2000;
    this.maxAwake = 4000;

    // Score
    this.nailsClipped = 0;
    this.totalNails = 8;

    // Visual effects
    this.clipFlash = null;
    this.shakeAmount = 0;
    this.biteFlash = 0;

    // Zzz animation
    this.zzzParticles = [];
  }

  createNails() {
    const nails = [];
    // Left paw nails (positions relative to left paw origin)
    const offsets = [
      { x: 25, y: 20 }, { x: 55, y: 12 }, { x: 85, y: 12 }, { x: 115, y: 20 }
    ];
    offsets.forEach((off, i) => {
      nails.push({
        id: `L${i + 1}`,
        paw: 'left',
        x: this.leftPawX + off.x,
        y: this.pawY + off.y,
        radius: 14,
        clipped: false
      });
    });
    // Right paw nails
    offsets.forEach((off, i) => {
      nails.push({
        id: `R${i + 1}`,
        paw: 'right',
        x: this.rightPawX + off.x,
        y: this.pawY + off.y,
        radius: 14,
        clipped: false
      });
    });
    return nails;
  }

  reset() {
    this.nails = this.createNails();
    this.catState = NAIL_STATE.SLEEPING;
    this.stateTimer = 0;
    this.nextWakeTime = this.randomSleepTime();
    this.nailsClipped = 0;
    this.clipFlash = null;
    this.shakeAmount = 0;
    this.biteFlash = 0;
    this.zzzParticles = [];
  }

  randomSleepTime() {
    return 3000 + Math.random() * 5000; // 3-8 seconds
  }

  randomAwakeTime() {
    return this.minAwake + Math.random() * (this.maxAwake - this.minAwake);
  }

  // ─── Update ───
  update(dt) {
    this.stateTimer += dt;

    // Update Zzz particles
    this.zzzParticles = this.zzzParticles.filter(p => {
      p.y -= p.speed * dt / 16;
      p.alpha -= 0.003 * dt / 16;
      return p.alpha > 0;
    });
    if (this.catState === NAIL_STATE.SLEEPING && Math.random() < 0.03) {
      this.zzzParticles.push({
        x: this.catX + 40 + (Math.random() - 0.5) * 60,
        y: this.catY - 30,
        speed: 0.5 + Math.random() * 0.5,
        alpha: 0.8
      });
    }

    // Fade effects
    if (this.clipFlash) {
      this.clipFlash.alpha -= 0.05 * dt / 16;
      if (this.clipFlash.alpha <= 0) this.clipFlash = null;
    }
    if (this.biteFlash > 0) {
      this.biteFlash -= 1.5 * dt / 16;
      if (this.biteFlash < 0) this.biteFlash = 0;
    }
    if (this.shakeAmount > 0) {
      this.shakeAmount *= 0.9;
      if (this.shakeAmount < 0.3) this.shakeAmount = 0;
    }

    // State machine
    switch (this.catState) {
      case NAIL_STATE.SLEEPING:
        if (this.stateTimer >= this.nextWakeTime) {
          this.catState = NAIL_STATE.WAKING;
          this.stateTimer = 0;
        }
        break;

      case NAIL_STATE.WAKING:
        if (this.stateTimer >= this.wakingDuration) {
          this.catState = NAIL_STATE.AWAKE;
          this.stateTimer = 0;
          this.awakeDuration = this.randomAwakeTime();
        }
        break;

      case NAIL_STATE.AWAKE:
        if (this.stateTimer >= this.awakeDuration) {
          this.catState = NAIL_STATE.SLEEPING;
          this.stateTimer = 0;
          this.nextWakeTime = this.randomSleepTime();
        }
        break;
    }
  }

  // ─── Touch handling ───
  handleTap(x, y) {
    // Check if tap hits a nail
    for (let nail of this.nails) {
      if (nail.clipped) continue;
      const dx = x - nail.x;
      const dy = y - nail.y;
      if (Math.sqrt(dx * dx + dy * dy) < nail.radius + 10) {
        if (this.catState === NAIL_STATE.AWAKE) {
          // Game over!
          return { action: 'BITE', nail: nail };
        }
        // Safe clip
        nail.clipped = true;
        this.nailsClipped++;
        this.clipFlash = { x: nail.x, y: nail.y, alpha: 1.0 };
        if (this.nailsClipped >= this.totalNails) {
          return { action: 'WIN' };
        }
        return { action: 'CLIP', nail: nail };
      }
    }
    return { action: 'NONE' };
  }

  // ─── Events for main.js audio ───
  getEvents() {
    const events = {};
    if (this.catState === NAIL_STATE.AWAKE && this._prevState !== NAIL_STATE.AWAKE) {
      events.awake = true;
    }
    this._prevState = this.catState;
    return events;
  }

  // ─── Render ───
  render(ctx) {
    ctx.save();

    // Background
    ctx.fillStyle = '#2C3E50';
    ctx.fillRect(0, 0, this.width, this.height);

    // Floor surface (table/desk)
    ctx.fillStyle = '#8B6914';
    ctx.fillRect(0, this.pawY + 120, this.width, this.height - this.pawY - 120);
    ctx.fillStyle = '#A0782C';
    ctx.fillRect(0, this.pawY + 120, this.width, 8);

    // Screen shake
    let sx = 0, sy = 0;
    if (this.shakeAmount > 0) {
      sx = (Math.random() - 0.5) * this.shakeAmount * 2;
      sy = (Math.random() - 0.5) * this.shakeAmount * 2;
    }
    ctx.translate(sx, sy);

    // Bite flash overlay
    if (this.biteFlash > 0) {
      ctx.fillStyle = `rgba(255, 0, 0, ${this.biteFlash * 0.3})`;
      ctx.fillRect(-10, -10, this.width + 20, this.height + 20);
    }

    // ─── Cat ───
    this.renderCat(ctx);

    // ─── Paws & Nails ───
    this.renderPaws(ctx);

    // ─── State indicator ───
    this.renderStateIndicator(ctx);

    // ─── Clip flash ───
    if (this.clipFlash) {
      ctx.fillStyle = `rgba(255, 255, 100, ${this.clipFlash.alpha * 0.7})`;
      ctx.beginPath();
      ctx.arc(this.clipFlash.x, this.clipFlash.y, 20, 0, Math.PI * 2);
      ctx.fill();
    }

    // ─── Zzz particles ───
    this.zzzParticles.forEach(p => {
      ctx.fillStyle = `rgba(200, 220, 255, ${p.alpha})`;
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Z', p.x, p.y);
      ctx.fillText('z', p.x + 8, p.y - 6);
      ctx.fillText('z', p.x + 16, p.y - 12);
    });

    ctx.restore();
  }

  renderCat(ctx) {
    const cx = this.catX;
    const cy = this.catY;
    const w = this.catW;
    const h = this.catH;

    // Cat body (blue rounded rect)
    const grad = ctx.createLinearGradient(cx - w / 2, cy - h / 2, cx - w / 2, cy + h / 2);
    grad.addColorStop(0, '#4A90D9');
    grad.addColorStop(1, '#2E6AB0');
    ctx.fillStyle = grad;
    this.roundRect(ctx, cx - w / 2, cy - h / 2, w, h, 30);
    ctx.fill();
    ctx.strokeStyle = '#1E4A80';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Ears
    ctx.fillStyle = '#3A7BC8';
    ctx.beginPath();
    ctx.moveTo(cx - w / 2 + 15, cy - h / 2 + 10);
    ctx.lineTo(cx - w / 2 - 5, cy - h / 2 - 25);
    ctx.lineTo(cx - w / 2 + 45, cy - h / 2 + 5);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#1E4A80';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx + w / 2 - 15, cy - h / 2 + 10);
    ctx.lineTo(cx + w / 2 + 5, cy - h / 2 - 25);
    ctx.lineTo(cx + w / 2 - 45, cy - h / 2 + 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Face
    if (this.catState === NAIL_STATE.SLEEPING) {
      // Sleeping eyes (curved lines)
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx - 30, cy - 10, 12, 0.2, Math.PI - 0.2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx + 30, cy - 10, 12, 0.2, Math.PI - 0.2);
      ctx.stroke();
    } else if (this.catState === NAIL_STATE.WAKING) {
      // Half-open eyes
      ctx.fillStyle = '#FFF';
      ctx.beginPath(); ctx.ellipse(cx - 30, cy - 10, 10, 7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx + 30, cy - 10, 10, 7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#111';
      ctx.beginPath(); ctx.arc(cx - 30, cy - 10, 5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + 30, cy - 10, 5, 0, Math.PI * 2); ctx.fill();
      // Half-close lid
      ctx.fillStyle = '#4A90D9';
      ctx.fillRect(cx - 40, cy - 17, 20, 7);
      ctx.fillRect(cx + 20, cy - 17, 20, 7);
    } else {
      // Awake: wide open angry eyes
      ctx.fillStyle = '#FFF';
      ctx.beginPath(); ctx.ellipse(cx - 30, cy - 10, 13, 15, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx + 30, cy - 10, 13, 15, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#C00';
      ctx.beginPath(); ctx.arc(cx - 30, cy - 10, 7, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + 30, cy - 10, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.arc(cx - 30, cy - 10, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + 30, cy - 10, 3.5, 0, Math.PI * 2); ctx.fill();
      // Angry eyebrows
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(cx - 43, cy - 25); ctx.lineTo(cx - 20, cy - 18); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + 43, cy - 25); ctx.lineTo(cx + 20, cy - 18); ctx.stroke();
    }

    // Nose
    ctx.fillStyle = '#FF8888';
    ctx.beginPath();
    ctx.moveTo(cx, cy + 8);
    ctx.lineTo(cx - 6, cy + 16);
    ctx.lineTo(cx + 6, cy + 16);
    ctx.closePath();
    ctx.fill();

    // Mouth
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(cx, cy + 16); ctx.lineTo(cx - 12, cy + 26); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy + 16); ctx.lineTo(cx + 12, cy + 26); ctx.stroke();

    // Whiskers
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx - 15, cy + 14); ctx.lineTo(cx - 55, cy + 8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - 15, cy + 18); ctx.lineTo(cx - 55, cy + 20); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 15, cy + 14); ctx.lineTo(cx + 55, cy + 8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 15, cy + 18); ctx.lineTo(cx + 55, cy + 20); ctx.stroke();
  }

  renderPaws(ctx) {
    // Left paw
    this.renderPaw(ctx, this.leftPawX, this.pawY, 'left');
    // Right paw
    this.renderPaw(ctx, this.rightPawX, this.pawY, 'right');
  }

  renderPaw(ctx, px, py, side) {
    // Paw pad
    ctx.fillStyle = '#3A7BC8';
    this.roundRect(ctx, px, py, this.pawW, this.pawH, 20);
    ctx.fill();
    ctx.strokeStyle = '#1E4A80';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Main pad
    ctx.fillStyle = '#5BA0E0';
    ctx.beginPath();
    ctx.ellipse(px + this.pawW / 2, py + this.pawH - 28, 35, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    // Toe pads
    for (let i = 0; i < 4; i++) {
      const tx = px + 25 + i * 30;
      const ty = py + 22;
      ctx.fillStyle = '#5BA0E0';
      ctx.beginPath();
      ctx.ellipse(tx, ty, 12, 16, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Nails
    const pawNails = this.nails.filter(n => n.paw === side);
    pawNails.forEach(nail => {
      ctx.fillStyle = nail.clipped ? '#8B949E' : '#FFFFFF';
      ctx.beginPath();
      ctx.arc(nail.x, nail.y, nail.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = nail.clipped ? '#666' : '#CCC';
      ctx.lineWidth = 2;
      ctx.stroke();

      if (nail.clipped) {
        // Checkmark
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(nail.x - 5, nail.y + 1);
        ctx.lineTo(nail.x - 1, nail.y + 6);
        ctx.lineTo(nail.x + 6, nail.y - 4);
        ctx.stroke();
      }
    });
  }

  renderStateIndicator(ctx) {
    let text, color;
    switch (this.catState) {
      case NAIL_STATE.SLEEPING:
        text = '😴 睡着啦…快剪！';
        color = '#4CAF50';
        break;
      case NAIL_STATE.WAKING:
        text = '⚠️ 猫猫要醒了！！';
        color = '#FF9800';
        break;
      case NAIL_STATE.AWAKE:
        text = '👀 醒着！别碰！！';
        color = '#FF4444';
        break;
    }

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    const textW = ctx.measureText(text).width;
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    const barW = Math.max(textW + 40, 200);
    const barH = 36;
    this.roundRect(ctx, this.width / 2 - barW / 2, this.pawY + 110, barW, barH, 18);
    ctx.fill();

    ctx.fillStyle = color;
    ctx.font = 'bold 20px Arial';
    ctx.fillText(text, this.width / 2, this.pawY + 134);

    // Progress
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '14px Arial';
    ctx.fillText(`已剪 ${this.nailsClipped} / ${this.totalNails} 个指甲`, this.width / 2, this.pawY + 158);
  }

  renderGameOver(ctx) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.fillStyle = '#FF4444';
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('被咬了！', this.width / 2, this.height / 2 - 50);

    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 22px Arial';
    ctx.fillText(`剪了 ${this.nailsClipped} / ${this.totalNails} 个指甲`, this.width / 2, this.height / 2);

    ctx.fillStyle = '#CCC';
    ctx.font = '16px Arial';
    ctx.fillText('点击屏幕重试', this.width / 2, this.height / 2 + 40);
  }

  renderWin(ctx) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.fillStyle = '#4CAF50';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🎉 指甲剪光光！', this.width / 2, this.height / 2 - 50);

    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 22px Arial';
    ctx.fillText('趁它没醒，溜了溜了…', this.width / 2, this.height / 2);

    ctx.fillStyle = '#CCC';
    ctx.font = '16px Arial';
    ctx.fillText('点击屏幕返回', this.width / 2, this.height / 2 + 40);
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
}

export default NailGame;
