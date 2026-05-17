/**
 * Singleton image cache to avoid reloading images
 */
class ImageCache {
  constructor() {
    this.cache = new Map();
    this.loadingPromises = new Map();
  }

  // Load image with caching
  load(src) {
    // Return cached image if available
    if (this.cache.has(src)) {
      const img = this.cache.get(src);
      if (img.width > 0) {
        return Promise.resolve(img);
      }
    }

    // Return existing promise if already loading
    if (this.loadingPromises.has(src)) {
      return this.loadingPromises.get(src);
    }

    // Create new load promise
    const promise = new Promise((resolve, reject) => {
      const img = wx.createImage();
      
      img.onload = () => {
        this.cache.set(src, img);
        this.loadingPromises.delete(src);
        resolve(img);
      };
      
      img.onerror = () => {
        this.loadingPromises.delete(src);
        reject(new Error(`Failed to load image: ${src}`));
      };
      
      img.src = src;
    });

    this.loadingPromises.set(src, promise);
    return promise;
  }

  // Get cached image (returns null if not loaded)
  get(src) {
    return this.cache.get(src) || null;
  }

  // Check if image is loaded
  isLoaded(src) {
    const img = this.cache.get(src);
    return img && img.width > 0;
  }

  // Preload multiple images
  preload(srcs) {
    return Promise.all(srcs.map(src => this.load(src)));
  }

  // Clear cache
  clear() {
    this.cache.clear();
    this.loadingPromises.clear();
  }
}

export default new ImageCache();
