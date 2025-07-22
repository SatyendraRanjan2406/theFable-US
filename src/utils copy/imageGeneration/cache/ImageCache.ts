import { ImageCache, ImageCacheEntry } from '../types';

export class InMemoryImageCache implements ImageCache {
  private cache = new Map<string, ImageCacheEntry>();
  private readonly maxSize = 100; // Maximum number of cached entries
  private readonly ttl = 30 * 60 * 1000; // 30 minutes TTL

  get(key: string): ImageCacheEntry | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry;
  }

  set(key: string, entry: ImageCacheEntry): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      ...entry,
      timestamp: Date.now()
    });
  }

  clear(pattern?: string): void {
    if (pattern) {
      // Clear entries matching the pattern
      const keysToDelete = Array.from(this.cache.keys()).filter(key => 
        key.includes(pattern)
      );
      keysToDelete.forEach(key => this.cache.delete(key));
    } else {
      // Clear all entries
      this.cache.clear();
    }
  }

  has(key: string): boolean {
    const entry = this.get(key);
    return entry !== null;
  }

  // Additional utility methods
  size(): number {
    return this.cache.size;
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    const keysToDelete = Array.from(this.cache.entries())
      .filter(([_, entry]) => now - entry.timestamp > this.ttl)
      .map(([key, _]) => key);
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }
} 