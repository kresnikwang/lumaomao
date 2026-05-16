import Cat, { CAT_STATE } from './cat.js';
import PetCat, { PET_STATE } from './pet_cat.js';
import InputHandler from './input.js';
import UI from './ui.js';
import Home from './home.js';
import Store from './store.js';
import Leaderboard from './leaderboard.js';
import AudioManager from './audio.js';

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

    this.score = 0;
    this.gameState = 'HOME'; // HOME, PLAYING, GAMEOVER, PET_GAME, PET_GAMEOVER, RANK
    
    this.lastTime = Date.now();
    
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
      const touch = res.touches[0];
      const x = touch.clientX;
      const y = touch.clientY;

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
    AudioManager.playPurr();
  }

  restartPet() {
    this.score = 0;
    this.gameState = 'PET_GAME';
    this.petCat.reset();
    AudioManager.playPurr();
  }

  update() {
    const now = Date.now();
    const dt = now - this.lastTime;
    this.lastTime = now;

    if (this.gameState === 'PLAYING') {
      this.updateBrush(dt);
    } else if (this.gameState === 'PET_GAME') {
      this.updatePet(dt);
    }
  }

  updateBrush(dt) {
    this.input.update();
    const isBrushing = this.input.isTouching && this.input.velocity > 0;
    this.cat.update(dt, isBrushing);

    if (isBrushing) {
      if (this.cat.state === CAT_STATE.LOOKING) {
        this.gameState = 'GAMEOVER';
        this.cat.bite();
        Store.saveScore('BRUSH', this.score);
        wx.vibrateLong();
        AudioManager.playBite();
      } else {
        this.score += this.input.velocity * 0.1;
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
    this.petCat.update(dt, this.input);
    this.score = this.petCat.happiness;

    if (this.petCat.state === PET_STATE.BITING) {
      this.gameState = 'PET_GAMEOVER';
      Store.saveScore('PET', this.score);
      AudioManager.playBite();
    } else if (this.petCat.state === PET_STATE.HAPPY && prevState !== PET_STATE.HAPPY) {
      AudioManager.playMeow();
    } else if (this.petCat.state === PET_STATE.ANNOYED && prevState !== PET_STATE.ANNOYED) {
      AudioManager.playHiss();
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
      this.ui.render(this.ctx, this.score, this.gameState === 'PET_GAMEOVER' ? 'GAMEOVER' : 'PLAYING');
    } else {
      this.cat.render(this.ctx);
      this.ui.render(this.ctx, this.score, this.gameState);
    }
  }

  loop() {
    this.update();
    this.render();
    requestAnimationFrame(this.loop.bind(this));
  }
}

new Main();
