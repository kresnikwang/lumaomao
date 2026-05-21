/**
 * Audio manager using WeChat Mini Game Web Audio API
 * All sounds are synthesized — no audio files needed
 */

class AudioManager {
  constructor() {
    this.initialized = false;
    this.webAudioCtx = null;
  }

  init() {
    if (this.initialized) return;

    // Try multiple ways to get a Web Audio context
    // wx.createWebAudioContext is the standard WeChat mini game API
    // wx.getWebAudioContext is an older variant
    try {
      if (typeof wx !== 'undefined') {
        if (wx.createWebAudioContext) {
          this.webAudioCtx = wx.createWebAudioContext();
          console.log('[Audio] Initialized via wx.createWebAudioContext');
        } else if (wx.getWebAudioContext) {
          this.webAudioCtx = wx.getWebAudioContext();
          console.log('[Audio] Initialized via wx.getWebAudioContext');
        }
      }
    } catch (e) {
      console.warn('[Audio] WeChat WebAudio init failed:', e.message);
    }

    if (this.webAudioCtx) {
      this.initialized = true;
      console.log('[Audio] Ready — sample rate:', this.webAudioCtx.sampleRate);
    } else {
      console.warn('[Audio] No Web Audio API available — all sounds silenced');
    }
  }

  resume() {
    if (!this.webAudioCtx) return;

    try {
      // WeChat WebAudio context may have .resume() or .state
      if (typeof this.webAudioCtx.resume === 'function') {
        this.webAudioCtx.resume();
      }
      // Some contexts expose state via a getter
      if (this.webAudioCtx.state === 'suspended' && typeof this.webAudioCtx.resume === 'function') {
        this.webAudioCtx.resume();
      }
    } catch (e) {
      console.warn('[Audio] resume failed:', e.message);
    }
  }

  // ─── Synthesized Sound Effects ───

  playPurr() {
    this.playTone(80, 0.3, 'sine', 0.25);
  }

  playBrush() {
    this.playNoise(0.08, 0.12);
  }

  playHiss() {
    this.playTone(800, 0.15, 'sawtooth', 0.15);
    setTimeout(() => this.playTone(600, 0.15, 'sawtooth', 0.15), 80);
  }

  playBite() {
    this.playTone(200, 0.08, 'square', 0.35);
    setTimeout(() => this.playTone(150, 0.15, 'square', 0.25), 40);
  }

  playClick() {
    this.playTone(1200, 0.04, 'sine', 0.15);
  }

  playMeow() {
    this.playTone(600, 0.12, 'sine', 0.2);
    setTimeout(() => this.playTone(800, 0.12, 'sine', 0.2), 100);
  }

  // ─── Core Audio Synthesis ───

  playTone(freq, duration, type = 'sine', volume = 0.3) {
    if (!this.webAudioCtx) return;

    try {
      const osc = this.webAudioCtx.createOscillator();
      const gain = this.webAudioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.webAudioCtx.currentTime);

      gain.gain.setValueAtTime(volume, this.webAudioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.webAudioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.webAudioCtx.destination);

      osc.start(this.webAudioCtx.currentTime);
      osc.stop(this.webAudioCtx.currentTime + duration + 0.01);
    } catch (e) {
      // Silently ignore — audio is non-critical
    }
  }

  playNoise(duration, volume = 0.2) {
    if (!this.webAudioCtx) return;

    try {
      const sampleRate = this.webAudioCtx.sampleRate || 44100;
      const bufferSize = Math.floor(sampleRate * duration);
      const buffer = this.webAudioCtx.createBuffer(1, bufferSize, sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.webAudioCtx.createBufferSource();
      noise.buffer = buffer;

      const gain = this.webAudioCtx.createGain();
      gain.gain.setValueAtTime(volume, this.webAudioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.webAudioCtx.currentTime + duration);

      noise.connect(gain);
      gain.connect(this.webAudioCtx.destination);
      noise.start();
    } catch (e) {
      // Silently ignore — audio is non-critical
    }
  }

  destroy() {
    if (this.webAudioCtx) {
      try {
        this.webAudioCtx.close();
      } catch (e) {
        // ignore
      }
      this.webAudioCtx = null;
    }
    this.initialized = false;
  }
}

export default new AudioManager();
