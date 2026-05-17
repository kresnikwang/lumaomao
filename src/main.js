import Cat, { CAT_STATE } from './cat.js';
import PetCat, { PET_STATE } from './pet_cat.js';
import InputHandler from './input.js';
import UI from './ui.js';
import Home from './home.js';
import Store from './store.js';
import Leaderboard from './leaderboard.js';
import AudioManager from './audio.js';
import ParticleSystem from './particles.js';
import Tutorial from './tutorial.js';
import { CONFIG } from './config.js';
import ImageCache from './imageCache.js';

class Main {
  constructor() {
    this.canvas = wx.createCanvas();
    this.ctx = this.canvas.getContext('2d');
    
    this.width = this.canvas.width;
    this.height = this.canvas.height;

    this.home = new Home(this.width, this.height);
    this.cat = new Cat(this.width, this.height);
    this.petCat = new PetCat(this.width, this.height);
    this.input = new InputHandler();
    this.ui = new UI(this.width, this.height);
    this.leaderboard = new Leaderboard(this.width, this.height);
    this.particles = new ParticleSystem();
    this.tutorial = new Tutorial(this.width, this.height);

    this.score = 0;
    this.gameState = 'HOME'; // HOME, PLAYING, GAMEOVER, PET_GAME, PET_GAMEOVER, RANK, PAUSED
    this.prevGameState = null; // For resuming from pause
    this.restartDelay = 0; // Delay before allowing restart after game over
    
    // Frame rate control
    this.lastTime = Date.now();
    this.targetFPS = CONFIG.CANVAS.TARGET_FPS;
    this.frameInterval = 1000 / this.targetFPS;
    this.accumulator = 0;
    
    // Background image for game scenes (via cache)
    this.bgImg = null;
    ImageCache.load('assets/images/bg_main.png').then(img => {
      this.bgImg = img;
    });
    
    // Pause button area (top-right corner)
    this.pauseBtn = {
      x: this.width - 60,
      y: 15,
      width: 45,
      height: 45
    };
    
    // Initialize audio
    AudioManager.init();
    
    this.bindEvents();
    this.loop();
  }

  bindEvents() {
    // Pause on app hide
    wx.onHide(() => {
      if (this.gameState === 'PLAYING' || this.gameState === 'PET_GAME') {
        this.prevGameState = this.gameState;
        this.gameState = 'PAUSED';
      }
    });
    
    // Resume on app show
    wx.onShow(() => {
      if (this.gameState === 'PAUSED' && this.prevGameState) {
        this.gameState = this.prevGameState;
        this.prevGameState = null;
        this.lastTime = Date.now(); // Reset timer to prevent huge dt
      }
    });
    
    wx.onTouchStart((res) => {
      // Resume audio context on first interaction
      AudioManager.resume();
      
      const touch = res.touches[0];
      const x = touch.clientX;
      const y = touch.clientY;

      // Check modal clicks first
      if (this.ui.modal.visible) {
        if (this.ui.checkModalClick(x, y)) {
          return;
        }
      }

      // Check pause button first (during gameplay)

      if ((this.gameState === 'PLAYING' || this.gameState === 'PET_GAME') &&
          x >= this.pauseBtn.x && x <= this.pauseBtn.x + this.pauseBtn.width &&
          y >= this.pauseBtn.y && y <= this.pauseBtn.y + this.pauseBtn.height) {
        this.prevGameState = this.gameState;
        this.gameState = 'PAUSED';
        return;
      }
      
      // Resume from pause
      if (this.gameState === 'PAUSED') {
        this.gameState = this.prevGameState;
        this.prevGameState = null;
        this.lastTime = Date.now();
        return;
      }

      // Check tutorial first
      if (this.tutorial.visible) {
        if (this.tutorial.checkClick(x, y)) {
          return;
        }
      }

      if (this.gameState === 'HOME') {
        const action = this.home.checkClick(x, y);
        if (action === 'BRUSH') {
          this.tryStartGame('BRUSH');
        } else if (action === 'PET') {
          this.tryStartGame('PET');
        } else if (action === 'RANK') {
          this.gameState = 'RANK';
        }
      } else if (this.gameState === 'GAMEOVER') {
        if (this.ui.backBtnRect && 
            x >= this.ui.backBtnRect.x && x <= this.ui.backBtnRect.x + this.ui.backBtnRect.width &&
            y >= this.ui.backBtnRect.y && y <= this.ui.backBtnRect.y + this.ui.backBtnRect.height) {
          this.gameState = 'HOME';
        } else if (this.restartDelay <= 0) {
          this.tryStartGame('BRUSH');
        }
      } else if (this.gameState === 'PET_GAMEOVER') {
        if (this.ui.backBtnRect && 
            x >= this.ui.backBtnRect.x && x <= this.ui.backBtnRect.x + this.ui.backBtnRect.width &&
            y >= this.ui.backBtnRect.y && y <= this.ui.backBtnRect.y + this.ui.backBtnRect.height) {
          this.gameState = 'HOME';
        } else if (this.restartDelay <= 0) {
          this.tryStartGame('PET');
        }
      } else if (this.gameState === 'RANK') {
        if (this.leaderboard.checkClick(x, y) === 'BACK') {
          this.gameState = 'HOME';
        }
      }
    });
  }

  tryStartGame(type) {
    AudioManager.playClick();
    if (Store.data.chances > 0) {
      Store.useChance();
      if (type === 'BRUSH') {
        this.restartBrush();
      } else {
        this.restartPet();
      }
    } else {
      this.showAdRefillDialog();
    }
  }

  showAdRefillDialog() {
    this.ui.showModal(
      '次数不足',
      '观看一个短视频广告即可\n获得3次游玩机会！',
      () => {
        this.mockWatchAd();
      },
      () => {}
    );
  }

  mockWatchAd() {
    wx.showLoading({ title: '视频加载中...' });
    setTimeout(() => {
      wx.hideLoading();
      wx.showToast({ title: '获得3次机会！', icon: 'success' });
      Store.refillChances();
    }, 2000);
  }

  restartBrush() {
    this.score = 0;
    this.restartDelay = 0;
    this.gameState = 'PLAYING';
    this.cat.reset();
    this.particles.clear();
    AudioManager.playPurr();
    
    // Show tutorial for first-time players
    if (this.tutorial.shouldShow('BRUSH')) {
      this.tutorial.start('BRUSH');
    }
  }

  restartPet() {
    this.score = 0;
    this.restartDelay = 0;
    this.gameState = 'PET_GAME';
    this.petCat.reset();
    this.particles.clear();
    AudioManager.playPurr();
    
    // Show tutorial for first-time players
    if (this.tutorial.shouldShow('PET')) {
      this.tutorial.start('PET');
    }
  }

  update() {
    const now = Date.now();
    const dt = Math.min(now - this.lastTime, 100); // Cap dt at 100ms to prevent huge jumps
    this.lastTime = now;
    
    // Skip update when paused
    if (this.gameState === 'PAUSED') {
      return;
    }
    
    this.accumulator += dt;
    
    // Fixed time step updates
    while (this.accumulator >= this.frameInterval) {
      if (this.gameState === 'PLAYING') {
        this.updateBrush(this.frameInterval);
      } else if (this.gameState === 'PET_GAME') {
        this.updatePet(this.frameInterval);
      }
      
      // Update particles and tutorial (even during pause for visual effects)
      if (this.gameState !== 'PAUSED') {
        this.particles.update(this.frameInterval);
        this.tutorial.update(this.frameInterval);
      }
      
      // Handle restart delay countdown
      if (this.restartDelay > 0) {
        this.restartDelay -= this.frameInterval;
        if (this.restartDelay < 0) this.restartDelay = 0;
      }
      
      this.accumulator -= this.frameInterval;
    }
  }

  updateBrush(dt) {
    this.input.update();
    const isBrushing = this.input.isTouching && this.input.velocity > this.input.minBrushVelocity;
    const prevScore = this.score;
    this.cat.update(dt, isBrushing, this.score);

    // Visual feedback for perfect stop
    if (this.cat.justGotPerfect) {
      this.particles.spawnScorePopup(
        this.cat.x + this.cat.width / 2,
        this.cat.y - 60,
        0,
        false,
        'PERFECT!'
      );
      this.ui.triggerShake(5);
      AudioManager.playMeow();
      this.cat.justGotPerfect = false; // Reset flag
    }

    if (isBrushing) {
      if (this.cat.state === CAT_STATE.LOOKING) {
        this.gameState = 'GAMEOVER';
        this.cat.bite();
        const finalScore = Math.floor(this.score);
        Store.saveScore('BRUSH', finalScore);
        wx.vibrateLong();
        AudioManager.playBite();
        
        // Effects
        this.ui.triggerShake(15);
        this.particles.spawnRedFlash(this.width, this.height);
        
        // 1 second delay before allowing restart
        this.restartDelay = 1000;
        return;
      } else {
        // Apply combo multiplier
        const multiplier = this.cat.getScoreMultiplier();
        const baseScore = this.input.smoothedVelocity * 0.1;
        const scoreGain = baseScore * multiplier;
        this.score += scoreGain;
        
        // Spawn fur particles
        if (Math.random() < CONFIG.PARTICLES.FUR_SPAWN_CHANCE) {
          this.particles.spawnFur(
            this.cat.x + this.cat.width / 2,
            this.cat.y + this.cat.height / 2
          );
        }
        
        // Score popup for significant gains
        const scoreDiff = this.score - prevScore;
        if (scoreDiff >= 5) {
          this.particles.spawnScorePopup(
            this.cat.x + this.cat.width / 2 + (Math.random() - 0.5) * 40,
            this.cat.y - 20,
            scoreDiff,
            this.cat.combo > 3
          );
        }
        
        if (Math.random() < 0.05) AudioManager.playBrush();
      }
    }
    
    // Play alert sound when cat enters ALERT state
    if (this.cat.state === CAT_STATE.ALERT && !this.alertPlayed) {
      AudioManager.playHiss();
      this.alertPlayed = true;
    }
    if (this.cat.state !== CAT_STATE.ALERT) {
      this.alertPlayed = false;
    }
  }

  updatePet(dt) {
    this.input.update();
    const prevState = this.petCat.state;
    const prevScore = this.score;
    this.petCat.update(dt, this.input);
    this.score = this.petCat.happiness;

    if (this.petCat.state === PET_STATE.BITING) {
      this.gameState = 'PET_GAMEOVER';
      const finalScore = Math.floor(this.score);
      Store.saveScore('PET', finalScore);
      AudioManager.playBite();
      
      // Effects
      this.ui.triggerShake(15);
      this.particles.spawnRedFlash(this.width, this.height);
      
      // 1 second delay before allowing restart
      this.restartDelay = 1000;
      return;
    } else if (this.petCat.state === PET_STATE.HAPPY && prevState !== PET_STATE.HAPPY) {
      AudioManager.playMeow();
      
      // Spawn heart particles
      this.particles.spawnHearts(
        this.petCat.x + this.petCat.width / 2,
        this.petCat.y + this.petCat.height / 2 - 30,
        2
      );
      
      // Score popup
      const scoreDiff = this.score - prevScore;
      if (scoreDiff > 0) {
        this.particles.spawnScorePopup(
          this.petCat.x + this.petCat.width / 2 + (Math.random() - 0.5) * 40,
          this.petCat.y - 20,
          scoreDiff,
          false
        );
      }
    } else if (this.petCat.state === PET_STATE.ANNOYED && prevState !== PET_STATE.ANNOYED) {
      AudioManager.playHiss();
      
      // Warning particles
      this.particles.spawnWarning(
        this.petCat.x + this.petCat.width / 2,
        this.petCat.y - 40
      );
    }
  }

  render() {
    // Draw background
    if (this.bgImg && this.bgImg.width > 0) {
      this.ctx.drawImage(this.bgImg, 0, 0, this.width, this.height);
    } else {
      this.ctx.fillStyle = '#FFF8DC';
      this.ctx.fillRect(0, 0, this.width, this.height);
    }

    if (this.gameState === 'HOME') {
      this.home.render(this.ctx, Store.data.chances);
    } else if (this.gameState === 'RANK') {
      this.leaderboard.render(this.ctx, Store.getLeaderboardData());
    } else if (this.gameState === 'PAUSED') {
      // Draw the game behind pause overlay
      if (this.prevGameState === 'PET_GAME') {
        this.petCat.render(this.ctx);
      } else {
        this.cat.render(this.ctx);
      }
      this.renderPauseOverlay();
    } else if (this.gameState === 'PET_GAME' || this.gameState === 'PET_GAMEOVER') {
      this.petCat.render(this.ctx);
      this.ui.render(this.ctx, this.score, this.gameState === 'PET_GAMEOVER' ? 'GAMEOVER' : 'PLAYING', {
        combo: 0,
        timeRemaining: this.petCat.getTimeRemaining(),
        isPetMode: true
      });
      // Draw pause button during gameplay
      if (this.gameState === 'PET_GAME') {
        this.renderPauseButton();
      }
    } else {
      this.cat.render(this.ctx);
      this.ui.render(this.ctx, this.score, this.gameState, {
        combo: this.cat.combo,
        difficulty: this.cat.difficultyLevel,
        isPetMode: false
      });
      // Draw pause button during gameplay
      if (this.gameState === 'PLAYING') {
        this.renderPauseButton();
        if (this.input.isTouching) {
          this.ui.drawBrushCursor(this.ctx, this.input.lastX, this.input.lastY);
        }
      }
    }
    
    // Render particles on top
    this.particles.render(this.ctx);
    
    // Render tutorial on top of everything
    this.tutorial.render(this.ctx);
  }
  
  renderPauseButton() {
    const btn = this.pauseBtn;
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.beginPath();
    this.ctx.moveTo(btn.x + 12, btn.y + 8);
    this.ctx.lineTo(btn.x + 12, btn.y + btn.height - 8);
    this.ctx.lineTo(btn.x + 20, btn.y + btn.height - 8);
    this.ctx.lineTo(btn.x + 20, btn.y + 8);
    this.ctx.closePath();
    this.ctx.fill();
    
    this.ctx.beginPath();
    this.ctx.moveTo(btn.x + 28, btn.y + 8);
    this.ctx.lineTo(btn.x + 28, btn.y + btn.height - 8);
    this.ctx.lineTo(btn.x + 36, btn.y + btn.height - 8);
    this.ctx.lineTo(btn.x + 36, btn.y + 8);
    this.ctx.closePath();
    this.ctx.fill();
  }
  
  renderPauseOverlay() {
    // Semi-transparent overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // Pause text
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = 'bold 48px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('暂停', this.width / 2, this.height / 2 - 30);
    
    this.ctx.fillStyle = '#CCCCCC';
    this.ctx.font = '20px Arial';
    this.ctx.fillText('点击屏幕继续', this.width / 2, this.height / 2 + 20);
  }

  loop() {
    this.update();
    this.render();
    requestAnimationFrame(this.loop.bind(this));
  }
}

new Main();
