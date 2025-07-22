/**
 * Image Cache Utility
 * Preloads and caches images to prevent repeated network requests
 */

interface ImageCacheEntry {
  url: string;
  blob: Blob;
  objectUrl: string;
  timestamp: number;
}

class ImageCache {
  private cache = new Map<string, ImageCacheEntry>();
  private preloadPromises = new Map<string, Promise<string>>();
  private maxCacheSize = 50; // Maximum number of images to cache
  private maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  /**
   * Preload an image and cache it
   */
  async preloadImage(url: string): Promise<string> {
    // Check if already cached
    const cached = this.cache.get(url);
    if (cached && this.isCacheValid(cached)) {
      return cached.objectUrl;
    }

    // Check if already preloading
    const existingPromise = this.preloadPromises.get(url);
    if (existingPromise) {
      return existingPromise;
    }

    // Start preloading
    const promise = this.loadAndCacheImage(url);
    this.preloadPromises.set(url, promise);
    
    try {
      const objectUrl = await promise;
      this.preloadPromises.delete(url);
      return objectUrl;
    } catch (error) {
      this.preloadPromises.delete(url);
      throw error;
    }
  }

  /**
   * Load multiple images in parallel
   */
  async preloadImages(urls: string[]): Promise<string[]> {
    const promises = urls.map(url => this.preloadImage(url));
    return Promise.all(promises);
  }

  /**
   * Get cached image URL or original URL if not cached
   */
  getCachedUrl(url: string): string {
    const cached = this.cache.get(url);
    if (cached && this.isCacheValid(cached)) {
      return cached.objectUrl;
    }
    return url;
  }

  /**
   * Check if image is cached
   */
  isCached(url: string): boolean {
    const cached = this.cache.get(url);
    return cached !== undefined && this.isCacheValid(cached);
  }

  /**
   * Clear expired cache entries
   */
  cleanupCache(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (!this.isCacheValid(entry)) {
        expiredKeys.push(key);
        URL.revokeObjectURL(entry.objectUrl);
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    for (const entry of this.cache.values()) {
      URL.revokeObjectURL(entry.objectUrl);
    }
    this.cache.clear();
    this.preloadPromises.clear();
  }

  /**
   * Get cache stats
   */
  getCacheStats(): { size: number; maxSize: number; hitRate: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      hitRate: this.cache.size > 0 ? (this.cache.size / this.maxCacheSize) * 100 : 0
    };
  }

  private async loadAndCacheImage(url: string): Promise<string> {
    try {
      // Fetch the image
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load image: ${response.status}`);
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      // Cache the image
      const entry: ImageCacheEntry = {
        url,
        blob,
        objectUrl,
        timestamp: Date.now()
      };

      // Clean up old cache entries if we're at capacity
      if (this.cache.size >= this.maxCacheSize) {
        this.evictOldestEntries();
      }

      this.cache.set(url, entry);
      return objectUrl;
    } catch (error) {
      console.error('Failed to load and cache image:', url, error);
      throw error;
    }
  }

  private isCacheValid(entry: ImageCacheEntry): boolean {
    return Date.now() - entry.timestamp < this.maxAge;
  }

  private evictOldestEntries(): void {
    // Remove the oldest 20% of entries
    const entriesToRemove = Math.floor(this.maxCacheSize * 0.2);
    const sortedEntries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);

    for (let i = 0; i < entriesToRemove && i < sortedEntries.length; i++) {
      const [key, entry] = sortedEntries[i];
      URL.revokeObjectURL(entry.objectUrl);
      this.cache.delete(key);
    }
  }
}

// Create singleton instance
const imageCache = new ImageCache();

// Auto cleanup every 30 minutes
setInterval(() => {
  imageCache.cleanupCache();
}, 30 * 60 * 1000);

export default imageCache;

// Export convenience functions
export const preloadImage = (url: string) => imageCache.preloadImage(url);
export const preloadImages = (urls: string[]) => imageCache.preloadImages(urls);
export const getCachedUrl = (url: string) => imageCache.getCachedUrl(url);
export const isCached = (url: string) => imageCache.isCached(url);
export const clearImageCache = () => imageCache.clearCache();
export const getImageCacheStats = () => imageCache.getCacheStats(); 