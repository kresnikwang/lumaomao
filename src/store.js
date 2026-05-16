const STORAGE_KEYS = {
  CHANCES: 'lumaomao_chances',
  LAST_RESET_DATE: 'lumaomao_last_reset',
  BRUSH_TOTAL_SCORE: 'lumaomao_brush_total',
  PET_TOTAL_SCORE: 'lumaomao_pet_total',
  BRUSH_HIGH_SCORE: 'lumaomao_brush_high',
  PET_HIGH_SCORE: 'lumaomao_pet_high',
  CHECKSUM: 'lumaomao_checksum'
};

class Store {
  constructor() {
    this.data = {
      chances: 3,
      brushTotal: 0,
      petTotal: 0,
      brushHigh: 0,
      petHigh: 0
    };
    this.init();
  }

  // Simple checksum to detect tampering
  calculateChecksum() {
    const dataStr = `${this.data.chances}|${this.data.brushTotal}|${this.data.petTotal}|${this.data.brushHigh}|${this.data.petHigh}`;
    let hash = 0;
    for (let i = 0; i < dataStr.length; i++) {
      const char = dataStr.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  verifyChecksum() {
    const stored = wx.getStorageSync(STORAGE_KEYS.CHECKSUM);
    if (!stored) return true; // No checksum yet, accept
    return stored === this.calculateChecksum();
  }

  saveWithChecksum() {
    const checksum = this.calculateChecksum();
    wx.setStorageSync(STORAGE_KEYS.CHECKSUM, checksum);
  }

  init() {
    const lastReset = wx.getStorageSync(STORAGE_KEYS.LAST_RESET_DATE);
    const today = new Date().toDateString();

    if (lastReset !== today) {
      // New day, reset chances
      this.data.chances = 3;
      wx.setStorageSync(STORAGE_KEYS.CHANCES, 3);
      wx.setStorageSync(STORAGE_KEYS.LAST_RESET_DATE, today);
    } else {
      this.data.chances = wx.getStorageSync(STORAGE_KEYS.CHANCES) || 0;
    }

    this.data.brushTotal = wx.getStorageSync(STORAGE_KEYS.BRUSH_TOTAL_SCORE) || 0;
    this.data.petTotal = wx.getStorageSync(STORAGE_KEYS.PET_TOTAL_SCORE) || 0;
    this.data.brushHigh = wx.getStorageSync(STORAGE_KEYS.BRUSH_HIGH_SCORE) || 0;
    this.data.petHigh = wx.getStorageSync(STORAGE_KEYS.PET_HIGH_SCORE) || 0;

    // Verify integrity
    if (!this.verifyChecksum()) {
      console.warn('Data integrity check failed, resetting scores');
      this.data.brushTotal = 0;
      this.data.petTotal = 0;
      this.data.brushHigh = 0;
      this.data.petHigh = 0;
      this.saveAll();
    }
  }

  saveAll() {
    wx.setStorageSync(STORAGE_KEYS.CHANCES, this.data.chances);
    wx.setStorageSync(STORAGE_KEYS.BRUSH_TOTAL_SCORE, this.data.brushTotal);
    wx.setStorageSync(STORAGE_KEYS.PET_TOTAL_SCORE, this.data.petTotal);
    wx.setStorageSync(STORAGE_KEYS.BRUSH_HIGH_SCORE, this.data.brushHigh);
    wx.setStorageSync(STORAGE_KEYS.PET_HIGH_SCORE, this.data.petHigh);
    this.saveWithChecksum();
  }

  useChance() {
    if (this.data.chances > 0) {
      this.data.chances--;
      wx.setStorageSync(STORAGE_KEYS.CHANCES, this.data.chances);
      this.saveWithChecksum();
      return true;
    }
    return false;
  }

  refillChances() {
    this.data.chances += 3;
    wx.setStorageSync(STORAGE_KEYS.CHANCES, this.data.chances);
    this.saveWithChecksum();
  }

  saveScore(type, score) {
    if (type === 'BRUSH') {
      this.data.brushTotal += score;
      if (score > this.data.brushHigh) this.data.brushHigh = score;
      wx.setStorageSync(STORAGE_KEYS.BRUSH_TOTAL_SCORE, this.data.brushTotal);
      wx.setStorageSync(STORAGE_KEYS.BRUSH_HIGH_SCORE, this.data.brushHigh);
    } else if (type === 'PET') {
      this.data.petTotal += score;
      if (score > this.data.petHigh) this.data.petHigh = score;
      wx.setStorageSync(STORAGE_KEYS.PET_TOTAL_SCORE, this.data.petTotal);
      wx.setStorageSync(STORAGE_KEYS.PET_HIGH_SCORE, this.data.petHigh);
    }
    this.saveWithChecksum();
  }

  getLeaderboardData() {
    return [
      { name: '梳毛毛', total: Math.floor(this.data.brushTotal), high: Math.floor(this.data.brushHigh) },
      { name: '摸猫猫', total: Math.floor(this.data.petTotal), high: Math.floor(this.data.petHigh) }
    ];
  }
}

export default new Store();
