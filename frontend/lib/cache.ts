const CACHE_PREFIX = 'summary_cache_';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface CacheItem {
  summary: string;
  timestamp: number;
}

export function getCachedSummary(articleId: string): string | null {
  try {
    const cacheKey = CACHE_PREFIX + articleId;
    const cachedData = localStorage.getItem(cacheKey);
    
    if (!cachedData) return null;
    
    const cacheItem: CacheItem = JSON.parse(cachedData);
    const now = Date.now();
    
    // Check if cache has expired
    if (now - cacheItem.timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(cacheKey);
      return null;
    }
    
    return cacheItem.summary;
  } catch (error) {
    console.error('Error reading from cache:', error);
    return null;
  }
}

export function setCachedSummary(articleId: string, summary: string): void {
  try {
    const cacheKey = CACHE_PREFIX + articleId;
    const cacheItem: CacheItem = {
      summary,
      timestamp: Date.now()
    };
    
    localStorage.setItem(cacheKey, JSON.stringify(cacheItem));
  } catch (error) {
    console.error('Error writing to cache:', error);
  }
}
