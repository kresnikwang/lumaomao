/**
 * Audio manager using WeChat Mini Game API
 * Falls back to Web Audio API if wx.createInnerAudioContext is not available
 */

class AudioManager {
  constructor() {
    this.initialized = false;
    // Use WeChat's inner audio context when available
    this.useWxAudio = typeof wx !== 'undefined' && wx.createInnerAudioContext;
    // Pool of audio contexts for overlapping sounds
    this.audioPool = [];
    this.poolSize = 5;
    this.poolIndex = 0;
    // Web Audio fallback
    this.webAudioCtx = null;
  }

  init() {
    if (this.initialized) return;
    
    if (this.useWxAudio) {
      // Pre-create pool of audio contexts
      for (let i = 0; i < this.poolSize; i++) {
        this.audioPool.push(wx.createInnerAudioContext());
      }
    } else {
      // Fallback to Web Audio API
      try {
        this.webAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        console.log('Web Audio not supported');
      }
    }
    
    this.initialized = true;
  }

  // Get next available audio context from pool
  getAudioCtx() {
    if (!this.useWxAudio) return null;
    const ctx = this.audioPool[this.poolIndex];
    this.poolIndex = (this.poolIndex + 1) % this.poolSize;
    // Stop previous sound if playing
    ctx.stop();
    return ctx;
  }

  // Play a sound using WeChat API or fallback
  playSound(src, volume = 1.0) {
    if (!this.initialized) return;
    
    if (this.useWxAudio) {
      const audio = this.getAudioCtx();
      if (audio) {
        audio.src = src;
        audio.volume = volume;
        audio.play();
      }
    } else {
      // Web Audio fallback - generate tones
      this.playTone(440, 0.1, 'sine', volume * 0.3);
    }
  }

  // Play a short purr sound (low frequency rumble)
  playPurr() {
    if (this.useWxAudio) {
      // Use generated tone as placeholder - replace with actual purr.mp3 if available
      this.playTone(80, 0.3, 'sine', 0.3);
    } else {
      this.playTone(80, 0.3, 'sine', 0.3);
    }
  }

  // Play brush sound (white noise)
  playBrush() {
    if (this.useWxAudio) {
      this.playNoise(0.1, 0.15);
    } else {
      this.playNoise(0.1, 0.15);
    }
  }

  // Play warning hiss
  playHiss() {
    if (this.useWxAudio) {
      this.playTone(800, 0.2, 'sawtooth', 0.2);
      setTimeout(() => this.playTone(600, 0.2, 'sawtooth', 0.2), 100);
    } else {
      this.playTone(800, 0.2, 'sawtooth', 0.2);
      setTimeout(() => this.playTone(600, 0.2, 'sawtooth', 0.2), 100);
    }
  }

  // Play bite/crunch sound
  playBite() {
    if (this.useWxAudio) {
      this.playTone(200, 0.1, 'square', 0.4);
      setTimeout(() => this.playTone(150, 0.2, 'square', 0.3), 50);
    } else {
      this.playTone(200, 0.1, 'square', 0.4);
      setTimeout(() => this.playTone(150, 0.2, 'square', 0.3), 50);
    }
  }

  // Play button click
  playClick() {
    if (this.useWxAudio) {
      this.playTone(1200, 0.05, 'sine', 0.2);
    } else {
      this.playTone(1200, 0.05, 'sine', 0.2);
    }
  }

  // Play happy meow
  playMeow() {
    if (this.useWxAudio) {
      this.playTone(600, 0.15, 'sine', 0.25);
      setTimeout(() => this.playTone(800, 0.15, 'sine', 0.25), 120);
    } else {
      this.playTone(600, 0.15, 'sine', 0.25);
      setTimeout(() => this.playTone(800, 0.15, 'sine', 0.25), 120);
    }
  }

  playTone(freq, duration, type = 'sine', volume = 0.3) {
    if (!this.webAudioCtx) return;
    
    const osc = this.webAudioCtx.createOscillator();
    const gain = this.webAudioCtx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.webAudioCtx.currentTime);
    
    gain.gain.setValueAtTime(volume, this.webAudioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.webAudioCtx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(this.webAudioCtx.destination);
    
    osc.start(this.webAudioCtx.currentTime);
    osc.stop(this.webAudioCtx.currentTime + duration);
  }

  playNoise(duration, volume = 0.2) {
    if (!this.webAudioCtx) return;
    
    const bufferSize = this.webAudioCtx.sampleRate * duration;
    const buffer = this.webAudioCtx.createBuffer(1, bufferSize, this.webAudioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = this.webAudioCtx.createBufferSource();
    noise.buffer = buffer;
    
    const gain = this.webAudioCtx.createGain();
    gain.gain.setValueAtTime(volume, this.webAudioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.webAudioCtx.currentTime + duration);
    
    noise.connect(gain);
    gain.connect(this.webAudioCtx.destination);
    noise.start();
  }

  // Clean up audio resources
  destroy() {
    if (this.useWxAudio) {
      this.audioPool.forEach(audio => {
        audio.destroy && audio.destroy();
      });
      this.audioPool = [];
    }
    if (this.webAudioCtx) {
      this.webAudioCtx.close();
      this.webAudioCtx = null;
    }
    this.initialized = false;
  }
}

export default new AudioManager();
