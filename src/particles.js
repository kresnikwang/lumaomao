/**
 * Particle system for visual effects
 */
export default class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  // Create fur particles when brushing
  spawnFur(x, y, count = 3) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 60,
        y: y + (Math.random() - 0.5) * 40,
        vx: (Math.random() - 0.5) * 2,
        vy: -Math.random() * 2 - 0.5,
        life: 1.0,
        decay: 0.01 + Math.random() * 0.02,
        size: 2 + Math.random() * 4,
        color: this.getRandomFurColor(),
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
        type: 'fur'
      });
    }
  }

  // Create score popup particles
  spawnScorePopup(x, y, score, isCombo = false) {
    const color = isCombo ? '#FF6B6B' : '#FFD700';
    const text = isCombo ? `${score}x 连击!` : `+${Math.floor(score)}`;
    
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: -2,
      life: 1.0,
      decay: 0.015,
      size: isCombo ? 28 : 22,
      color,
      text,
      type: 'text'
    });
  }

  // Create red flash effect when bitten
  spawnRedFlash(width, height) {
    this.particles.push({
      x: 0,
      y: 0,
      width,
      height,
      life: 1.0,
      decay: 0.05,
      color: 'rgba(255, 0, 0, 0.3)',
      type: 'flash'
    });
  }

  // Create heart particles for happy petting
  spawnHearts(x, y, count = 2) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 40,
        y: y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 1,
        vy: -Math.random() * 2 - 1,
        life: 1.0,
        decay: 0.02,
        size: 12 + Math.random() * 8,
        color: '#FF69B4',
        type: 'heart'
      });
    }
  }

  // Create warning particles
  spawnWarning(x, y) {
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: -1.5,
      life: 1.0,
      decay: 0.025,
      size: 20,
      color: '#FF4444',
      text: '!',
      type: 'text'
    });
  }

  getRandomFurColor() {
    const colors = ['#F5DEB3', '#DEB887', '#D2B48C', '#BC8F8F', '#FFE4B5', '#FFEFD5'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= p.decay;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      if (p.type !== 'flash') {
        p.x += p.vx;
        p.y += p.vy;
      }

      if (p.type === 'fur') {
        p.rotation += p.rotationSpeed;
        p.vy += 0.02; // gravity
        p.vx *= 0.99; // air resistance
      }
    }
  }

  render(ctx) {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.life;

      if (p.type === 'text') {
        ctx.fillStyle = p.color;
        ctx.font = `bold ${p.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(p.text, p.x, p.y);
      } else if (p.type === 'flash') {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.width, p.height);
      } else if (p.type === 'heart') {
        this.drawHeart(ctx, p.x, p.y, p.size, p.color);
      } else if (p.type === 'fur') {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      }

      ctx.restore();
    }
  }

  drawHeart(ctx, x, y, size, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    const topCurveHeight = size * 0.3;
    ctx.moveTo(x, y + topCurveHeight);
    // top left curve
    ctx.bezierCurveTo(
      x, y,
      x - size / 2, y,
      x - size / 2, y + topCurveHeight
    );
    // bottom left curve
    ctx.bezierCurveTo(
      x - size / 2, y + (size + topCurveHeight) / 2,
      x, y + (size + topCurveHeight) / 2,
      x, y + size
    );
    // bottom right curve
    ctx.bezierCurveTo(
      x, y + (size + topCurveHeight) / 2,
      x + size / 2, y + (size + topCurveHeight) / 2,
      x + size / 2, y + topCurveHeight
    );
    // top right curve
    ctx.bezierCurveTo(
      x + size / 2, y,
      x, y,
      x, y + topCurveHeight
    );
    ctx.closePath();
    ctx.fill();
  }

  clear() {
    this.particles = [];
  }
}
