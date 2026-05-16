/**
 * Simple audio synthesizer for game sound effects
 * Uses Web Audio API to generate sounds programmatically
 */

class AudioManager {
  constructor() {
    this.ctx = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      this.ctx = wx.createInnerAudioContext ? null : new (wx.createInnerAudioContext || AudioContext)();
      this.initialized = true;
    } catch (e) {
      console.log('Audio not supported');
    }
  }

  // Play a short purr sound (low frequency rumble)
  playPurr() {
    this.playTone(80, 0.3, 'sine', 0.3);
  }

  // Play brush sound (white noise)
  playBrush() {
    this.playNoise(0.1, 0.15);
  }

  // Play warning hiss
  playHiss() {
    this.playTone(800, 0.2, 'sawtooth', 0.2);
    setTimeout(() => this.playTone(600, 0.2, 'sawtooth', 0.2), 100);
  }

  // Play bite/crunch sound
  playBite() {
    this.playTone(200, 0.1, 'square', 0.4);
    setTimeout(() => this.playTone(150, 0.2, 'square', 0.3), 50);
  }

  // Play button click
  playClick() {
    this.playTone(1200, 0.05, 'sine', 0.2);
  }

  // Play happy meow
  playMeow() {
    this.playTone(600, 0.15, 'sine', 0.25);
    setTimeout(() => this.playTone(800, 0.15, 'sine', 0.25), 120);
  }

  playTone(freq, duration, type = 'sine', volume = 0.3) {
    if (!this.ctx) return;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + duration);
  }

  playNoise(duration, volume = 0.2) {
    if (!this.ctx) return;
    
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
    
    noise.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start();
  }
}

export default new AudioManager();
