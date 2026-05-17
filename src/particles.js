/**
 * Particle system with object pooling for performance
 */
export default class ParticleSystem {
  constructor(maxPoolSize = 200) {
    this.particles = [];
    this.maxPoolSize = maxPoolSize;
    this.pool = []; // Object pool for reuse
    this.activeCount = 0;
  }

  // Get a particle from pool or create new
  getParticle() {
    if (this.pool.length > 0) {
      return this.pool.pop();
    }
    return {};
  }

  // Return particle to pool
  recycleParticle(p) {
    if (this.pool.length < this.maxPoolSize) {
      // Clear object properties for reuse
      for (let key in p) {
        delete p[key];
      }
      this.pool.push(p);
    }
  }

  // Create fur particles when brushing
  spawnFur(x, y, count = 3) {
    for (let i = 0; i < count; i++) {
      if (this.activeCount >= this.maxPoolSize) break;
      
      const p = this.getParticle();
      p.x = x + (Math.random() - 0.5) * 60;
      p.y = y + (Math.random() - 0.5) * 40;
      p.vx = (Math.random() - 0.5) * 2;
      p.vy = -Math.random() * 2 - 0.5;
      p.life = 1.0;
      p.decay = 0.01 + Math.random() * 0.02;
      p.size = 2 + Math.random() * 4;
      p.color = this.getRandomFurColor();
      p.rotation = Math.random() * Math.PI * 2;
      p.rotationSpeed = (Math.random() - 0.5) * 0.2;
      p.type = 'fur';
      p.active = true;
      
      this.particles.push(p);
      this.activeCount++;
    }
  }

  // Create score popup particles
  spawnScorePopup(x, y, score, isCombo = false) {
    if (this.activeCount >= this.maxPoolSize) return;
    
    const p = this.getParticle();
    p.x = x;
    p.y = y;
    p.vx = 0;
    p.vy = -2;
    p.life = 1.0;
    p.decay = 0.015;
    p.size = isCombo ? 28 : 22;
    p.color = isCombo ? '#FF6B6B' : '#FFD700';
    p.text = isCombo ? `${score}x 连击!` : `+${Math.floor(score)}`;
    p.type = 'text';
    p.active = true;
    
    this.particles.push(p);
    this.activeCount++;
  }

  // Create red flash effect when bitten
  spawnRedFlash(width, height) {
    if (this.activeCount >= this.maxPoolSize) return;
    
    const p = this.getParticle();
    p.x = 0;
    p.y = 0;
    p.width = width;
    p.height = height;
    p.life = 1.0;
    p.decay = 0.05;
    p.color = 'rgba(255, 0, 0, 0.3)';
    p.type = 'flash';
    p.active = true;
    
    this.particles.push(p);
    this.activeCount++;
  }

  // Create heart particles for happy petting
  spawnHearts(x, y, count = 2) {
    for (let i = 0; i < count; i++) {
      if (this.activeCount >= this.maxPoolSize) break;
      
      const p = this.getParticle();
      p.x = x + (Math.random() - 0.5) * 40;
      p.y = y + (Math.random() - 0.5) * 20;
      p.vx = (Math.random() - 0.5) * 1;
      p.vy = -Math.random() * 2 - 1;
      p.life = 1.0;
      p.decay = 0.02;
      p.size = 12 + Math.random() * 8;
      p.color = '#FF69B4';
      p.type = 'heart';
      p.active = true;
      
      this.particles.push(p);
      this.activeCount++;
    }
  }

  // Create warning particles
  spawnWarning(x, y) {
    if (this.activeCount >= this.maxPoolSize) return;
    
    const p = this.getParticle();
    p.x = x;
    p.y = y;
    p.vx = 0;
    p.vy = -1.5;
    p.life = 1.0;
    p.decay = 0.025;
    p.size = 20;
    p.color = '#FF4444';
    p.text = '!';
    p.type = 'text';
    p.active = true;
    
    this.particles.push(p);
    this.activeCount++;
  }

  getRandomFurColor() {
    const colors = ['#F5DEB3', '#DEB887', '#D2B48C', '#BC8F8F', '#FFE4B5', '#FFEFD5'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  update(dt) {
    // Use index-based iteration for O(1) removal
    let writeIndex = 0;
    
    for (let readIndex = 0; readIndex < this.particles.length; readIndex++) {
      const p = this.particles[readIndex];
      
      if (!p.active) continue;
      
      p.life -= p.decay;

      if (p.life <= 0) {
        p.active = false;
        this.recycleParticle(p);
        this.activeCount--;
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
      
      // Keep active particles at the front
      this.particles[writeIndex++] = p;
    }
    
    // Trim array to active particles only
    this.particles.length = writeIndex;
  }

  render(ctx) {
    for (const p of this.particles) {
      if (!p.active) continue;
      
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
    // Recycle all particles
    for (const p of this.particles) {
      if (p.active) {
        this.recycleParticle(p);
      }
    }
    this.particles = [];
    this.activeCount = 0;
  }
}
