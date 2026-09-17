import type { CacheAdapter, CachedResponse } from './types';

const DEFAULT_TTL = 60 * 60 * 1000;
const MEMORY_CACHE_MAX_SIZE = 500;

export class MemoryCache implements CacheAdapter {
  private cache = new Map<string, CachedResponse<unknown>>();
  private accessOrder = new Set<string>();

  async get<T>(key: string): Promise<CachedResponse<T> | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.accessOrder.delete(key);
      return null;
    }

    this.accessOrder.delete(key);
    this.accessOrder.add(key);
    return entry as CachedResponse<T>;
  }

  async set<T>(key: string, value: CachedResponse<T>): Promise<void> {
    if (this.cache.size >= MEMORY_CACHE_MAX_SIZE && !this.cache.has(key)) {
      const oldestKey = this.accessOrder.values().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
        this.accessOrder.delete(oldestKey);
      }
    }

    this.cache.set(key, value);
    this.accessOrder.add(key);
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
    this.accessOrder.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

export class KVCache implements CacheAdapter {
  constructor(
    private kv: KVNamespace,
    private keyPrefix = 'serpapi:cache:'
  ) {}

  async get<T>(key: string): Promise<CachedResponse<T> | null> {
    const fullKey = this.keyPrefix + key;
    const value = await this.kv.get(fullKey, { type: 'json' });
    if (!value) return null;

    const entry = value as CachedResponse<T>;
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      await this.kv.delete(fullKey);
      return null;
    }
    return entry;
  }

  async set<T>(key: string, value: CachedResponse<T>): Promise<void> {
    const fullKey = this.keyPrefix + key;
    const expirationTtl = Math.ceil(value.ttl / 1000);
    await this.kv.put(fullKey, JSON.stringify(value), { expirationTtl });
  }

  async delete(key: string): Promise<void> {
    const fullKey = this.keyPrefix + key;
    await this.kv.delete(fullKey);
  }
}

export class TieredCache implements CacheAdapter {
  constructor(
    private l1: MemoryCache,
    private l2: KVCache
  ) {}

  async get<T>(key: string): Promise<CachedResponse<T> | null> {
    const l1Result = await this.l1.get<T>(key);
    if (l1Result) return l1Result;

    const l2Result = await this.l2.get<T>(key);
    if (l2Result) {
      await this.l1.set(key, l2Result);
      return l2Result;
    }

    return null;
  }

  async set<T>(key: string, value: CachedResponse<T>): Promise<void> {
    await Promise.all([
      this.l1.set(key, value),
      this.l2.set(key, value),
    ]);
  }

  async delete(key: string): Promise<void> {
    await Promise.all([
      this.l1.delete(key),
      this.l2.delete(key),
    ]);
  }
}

export function createCacheKey(engine: string, params: Record<string, unknown>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((acc, key) => {
      if (params[key] !== undefined && params[key] !== null && key !== 'api_key' && key !== 'no_cache') {
        acc[key] = params[key];
      }
      return acc;
    }, {} as Record<string, unknown>);

  const paramsStr = JSON.stringify(sortedParams);
  const hash = simpleHash(paramsStr);
  return `${engine}:${hash}`;
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

export function createTieredCache(kv?: KVNamespace): CacheAdapter {
  const memory = new MemoryCache();
  if (kv) {
    return new TieredCache(memory, new KVCache(kv));
  }
  return memory;
}