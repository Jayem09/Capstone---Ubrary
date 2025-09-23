// Image service for optimizing image loading and caching
class ImageService {
  private static cache = new Map<string, Promise<string>>();
  private static preloadCache = new Map<string, HTMLImageElement>();

  /**
   * Preload an image and cache it
   */
  static async preloadImage(src: string): Promise<string> {
    if (!src) return Promise.reject('No source provided');

    // Return cached promise if exists
    if (this.cache.has(src)) {
      return this.cache.get(src)!;
    }

    // Create new preload promise
    const preloadPromise = new Promise<string>((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        this.preloadCache.set(src, img);
        resolve(src);
      };
      
      img.onerror = () => {
        this.cache.delete(src); // Remove failed promise from cache
        reject(new Error(`Failed to load image: ${src}`));
      };
      
      img.src = src;
    });

    this.cache.set(src, preloadPromise);
    return preloadPromise;
  }

  /**
   * Preload multiple images with concurrency control
   */
  static async preloadImages(sources: string[], maxConcurrency = 3): Promise<PromiseSettledResult<string>[]> {
    const batches: string[][] = [];
    
    // Split sources into batches
    for (let i = 0; i < sources.length; i += maxConcurrency) {
      batches.push(sources.slice(i, i + maxConcurrency));
    }

    const results: PromiseSettledResult<string>[] = [];

    // Process batches sequentially
    for (const batch of batches) {
      const batchPromises = batch.map(src => this.preloadImage(src));
      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults);
      
      // Small delay between batches to prevent overwhelming the browser
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    return results;
  }

  /**
   * Check if image is cached
   */
  static isImageCached(src: string): boolean {
    return this.preloadCache.has(src);
  }

  /**
   * Get cached image element
   */
  static getCachedImage(src: string): HTMLImageElement | null {
    return this.preloadCache.get(src) || null;
  }

  /**
   * Clear cache (useful for memory management)
   */
  static clearCache(): void {
    this.cache.clear();
    this.preloadCache.clear();
  }

  /**
   * Get cache size for debugging
   */
  static getCacheSize(): { promises: number; images: number } {
    return {
      promises: this.cache.size,
      images: this.preloadCache.size
    };
  }

  /**
   * Clean up expired cache entries (if needed)
   */
  static cleanupCache(_maxAge = 10 * 60 * 1000): void { // 10 minutes default
    // This is a simplified cleanup - in a real app you might want to track timestamps
    if (this.cache.size > 100) { // Arbitrary limit
      this.cache.clear();
      this.preloadCache.clear();
    }
  }

  /**
   * Create optimized image URL with quality and size parameters
   */
  static optimizeImageUrl(src: string, options?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpg' | 'png';
  }): string {
    if (!src || !options) return src;

    // This would be implemented based on your image CDN/service
    // For example, if using Supabase with image transformations:
    const url = new URL(src);
    
    if (options.width) url.searchParams.set('width', options.width.toString());
    if (options.height) url.searchParams.set('height', options.height.toString());
    if (options.quality) url.searchParams.set('quality', options.quality.toString());
    if (options.format) url.searchParams.set('format', options.format);

    return url.toString();
  }

  /**
   * Create responsive image sources for different screen sizes
   */
  static createResponsiveSources(src: string): {
    mobile: string;
    tablet: string;
    desktop: string;
  } {
    return {
      mobile: this.optimizeImageUrl(src, { width: 400, quality: 80, format: 'webp' }),
      tablet: this.optimizeImageUrl(src, { width: 800, quality: 85, format: 'webp' }),
      desktop: this.optimizeImageUrl(src, { width: 1200, quality: 90, format: 'webp' })
    };
  }
}

export { ImageService };
