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
    this.gameState = 'HOME'; // HOME, PLAYING, GAMEOVER, PET_GAME, PET_GAMEOVER, RANK
    
    // Frame rate control
    this.lastTime = Date.now();
    this.targetFPS = CONFIG.CANVAS.TARGET_FPS;
    this.frameInterval = 1000 / this.targetFPS;
    this.accumulator = 0;
    
    // Background image for game scenes
    this.bgImg = wx.createImage();
    this.bgImg.src = 'assets/images/bg_main.png';
    
    // Initialize audio
    AudioManager.init();
    
    this.bindEvents();
    this.loop();
  }

  bindEvents() {
    wx.onTouchStart((res) => {
      // Resume audio context on first interaction
      AudioManager.resume();
      
      const touch = res.touches[0];
      const x = touch.clientX;
      const y = touch.clientY;

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
        } else {
          this.tryStartGame('BRUSH');
        }
      } else if (this.gameState === 'PET_GAMEOVER') {
        if (this.ui.backBtnRect && 
            x >= this.ui.backBtnRect.x && x <= this.ui.backBtnRect.x + this.ui.backBtnRect.width &&
            y >= this.ui.backBtnRect.y && y <= this.ui.backBtnRect.y + this.ui.backBtnRect.height) {
          this.gameState = 'HOME';
        } else {
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
    wx.showModal({
      title: '次数不足',
      content: '观看一个短视频广告即可获得3次游玩机会！',
      confirmText: '看广告',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.mockWatchAd();
        }
      }
    });
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
    
    this.accumulator += dt;
    
    // Fixed time step updates
    while (this.accumulator >= this.frameInterval) {
      if (this.gameState === 'PLAYING') {
        this.updateBrush(this.frameInterval);
      } else if (this.gameState === 'PET_GAME') {
        this.updatePet(this.frameInterval);
      }
      
      // Update particles and tutorial
      this.particles.update();
      this.tutorial.update(this.frameInterval);
      
      this.accumulator -= this.frameInterval;
    }
  }

  updateBrush(dt) {
    this.input.update();
    const isBrushing = this.input.isTouching && this.input.velocity > 0;
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
    } else if (this.gameState === 'PET_GAME' || this.gameState === 'PET_GAMEOVER') {
      this.petCat.render(this.ctx);
      this.ui.render(this.ctx, this.score, this.gameState === 'PET_GAMEOVER' ? 'GAMEOVER' : 'PLAYING', {
        combo: 0,
        timeRemaining: this.petCat.getTimeRemaining(),
        isPetMode: true
      });
    } else {
      this.cat.render(this.ctx);
      this.ui.render(this.ctx, this.score, this.gameState, {
        combo: this.cat.combo,
        difficulty: this.cat.difficultyLevel,
        isPetMode: false
      });
    }
    
    // Render particles on top
    this.particles.render(this.ctx);
    
    // Render tutorial on top of everything
    this.tutorial.render(this.ctx);
  }

  loop() {
    this.update();
    this.render();
    requestAnimationFrame(this.loop.bind(this));
  }
}

new Main();
