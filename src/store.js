const STORAGE_KEYS = {
  CHANCES: 'lumaomao_chances',
  LAST_RESET_DATE: 'lumaomao_last_reset',
  BRUSH_TOTAL_SCORE: 'lumaomao_brush_total',
  PET_TOTAL_SCORE: 'lumaomao_pet_total',
  BRUSH_HIGH_SCORE: 'lumaomao_brush_high',
  PET_HIGH_SCORE: 'lumaomao_pet_high'
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
  }

  useChance() {
    if (this.data.chances > 0) {
      this.data.chances--;
      wx.setStorageSync(STORAGE_KEYS.CHANCES, this.data.chances);
      return true;
    }
    return false;
  }

  refillChances() {
    this.data.chances += 3;
    wx.setStorageSync(STORAGE_KEYS.CHANCES, this.data.chances);
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
  }

  getLeaderboardData() {
    return [
      { name: '梳毛毛', total: Math.floor(this.data.brushTotal), high: Math.floor(this.data.brushHigh) },
      { name: '摸猫猫', total: Math.floor(this.data.petTotal), high: Math.floor(this.data.petHigh) }
    ];
  }
}

export default new Store();
