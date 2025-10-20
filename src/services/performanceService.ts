// Performance optimization service for UBrary
import { DocumentService } from './documentService';
import type { Document } from '../types/database';

// Cache configuration
const CACHE_CONFIG = {
  DOCUMENTS_TTL: 5 * 60 * 1000, // 5 minutes
  SEARCH_TTL: 2 * 60 * 1000, // 2 minutes
  USER_DATA_TTL: 10 * 60 * 1000, // 10 minutes
  MAX_CACHE_SIZE: 100, // Maximum number of cached items
};

// In-memory cache with TTL
class PerformanceCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  set(key: string, data: any, ttl: number = CACHE_CONFIG.DOCUMENTS_TTL): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= CACHE_CONFIG.MAX_CACHE_SIZE) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    // Check if expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear(): void {
    this.cache.clear();
  }

  // Clear expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Global cache instance
const cache = new PerformanceCache();

// Cleanup expired cache entries every 5 minutes
setInterval(() => cache.cleanup(), 5 * 60 * 1000);

export class PerformanceService {
  // Debounced search function
  private static searchTimeout: NodeJS.Timeout | null = null;

  // Optimized document fetching with caching
  static async getDocumentsOptimized(options?: {
    limit?: number;
    offset?: number;
    category?: string;
    search?: string;
    userId?: string;
    includeUnpublished?: boolean;
  }): Promise<{ data: Document[]; error: any }> {
    // Create cache key
    const cacheKey = `documents_${JSON.stringify(options || {})}`;
    
    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached) {
      return { data: cached, error: null };
    }

    // Fetch from service
    const result = await DocumentService.getDocuments(options);
    
    // Cache successful results
    if (result.data && !result.error) {
      cache.set(cacheKey, result.data, CACHE_CONFIG.DOCUMENTS_TTL);
    }

    return result;
  }

  // Debounced search with caching
  static async searchDocumentsOptimized(
    query: string,
    delay: number = 300
  ): Promise<{ data: Document[]; error: any }> {
    return new Promise((resolve) => {
      // Clear previous timeout
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout);
      }

      // Check cache first
      const cacheKey = `search_${query}`;
      const cached = cache.get(cacheKey);
      if (cached) {
        resolve({ data: cached, error: null });
        return;
      }

      // Debounce search
      this.searchTimeout = setTimeout(async () => {
        try {
          const result = await DocumentService.searchDocuments(query);
          
          // Cache successful results
          if (result.data && !result.error) {
            cache.set(cacheKey, result.data, CACHE_CONFIG.SEARCH_TTL);
          }
          
          // this.lastSearchQuery = query;
          resolve(result);
        } catch (error) {
          resolve({ data: [], error });
        }
      }, delay);
    });
  }

  // Prefetch documents for better UX
  static async prefetchDocuments(categories: string[]): Promise<void> {
    const prefetchPromises = categories.map(category => 
      this.getDocumentsOptimized({ category, limit: 20 })
    );

    try {
      await Promise.allSettled(prefetchPromises);
    } catch (error) {
      console.warn('Prefetch failed:', error);
    }
  }

  // Optimized document loading with pagination
  static async loadDocumentsPaginated(
    page: number = 1,
    pageSize: number = 20,
    filters?: any
  ): Promise<{ data: Document[]; hasMore: boolean; total: number }> {
    const offset = (page - 1) * pageSize;
    const cacheKey = `paginated_${page}_${pageSize}_${JSON.stringify(filters || {})}`;
    
    // Check cache
    const cached = cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch with limit + 1 to check if there are more items
    const result = await DocumentService.getDocuments({
      ...filters,
      limit: pageSize + 1,
      offset
    });

    const hasMore = result.data && result.data.length > pageSize;
    const data = hasMore ? result.data.slice(0, pageSize) : (result.data || []);

    const response = {
      data,
      hasMore,
      total: data.length + (hasMore ? 1 : 0) // Approximate total
    };

    // Cache the result
    cache.set(cacheKey, response, CACHE_CONFIG.DOCUMENTS_TTL);

    return response;
  }

  // Image optimization helper
  static optimizeImageUrl(url: string, width?: number, height?: number, quality: number = 80): string {
    if (!url) return '';
    
    // For Supabase storage URLs, add optimization parameters
    if (url.includes('supabase')) {
      const params = new URLSearchParams();
      if (width) params.set('width', width.toString());
      if (height) params.set('height', height.toString());
      params.set('quality', quality.toString());
      params.set('format', 'webp');
      
      return `${url}?${params.toString()}`;
    }
    
    return url;
  }

  // Lazy loading helper for images
  static createLazyImageLoader(): IntersectionObserver {
    return new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = img.dataset.src;
            if (src) {
              img.src = src;
              img.removeAttribute('data-src');
              img.classList.remove('lazy');
            }
          }
        });
      },
      {
        rootMargin: '50px 0px', // Start loading 50px before the image comes into view
        threshold: 0.1
      }
    );
  }

  // Performance monitoring
  static measurePerformance<T>(
    name: string,
    fn: () => Promise<T> | T
  ): Promise<T> {
    const start = performance.now();
    
    return Promise.resolve(fn()).then((result) => {
      const end = performance.now();
      const duration = end - start;
      
      // Log slow operations
      if (duration > 100) {
        console.warn(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`);
      }
      
      return result;
    });
  }

  // Clear all caches
  static clearCache(): void {
    cache.clear();
  }

  // Get cache statistics
  static getCacheStats(): { size: number; keys: string[] } {
    return {
      size: cache['cache'].size,
      keys: Array.from(cache['cache'].keys())
    };
  }
}
