import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryCache, createCacheKey, createTieredCache } from '../src/lib/cache';

describe('MemoryCache', () => {
  let cache: MemoryCache;

  beforeEach(() => {
    cache = new MemoryCache();
  });

  it('should store and retrieve values', async () => {
    const key = 'test-key';
    const value = { data: { test: 'value' }, timestamp: Date.now(), ttl: 60000, engine: 'google', paramsHash: 'abc123' };

    await cache.set(key, value);
    const result = await cache.get(key);

    expect(result).toEqual(value);
  });

  it('should return null for non-existent keys', async () => {
    const result = await cache.get('non-existent');
    expect(result).toBeNull();
  });

  it('should expire entries after TTL', async () => {
    const key = 'expiring-key';
    const value = { data: { test: 'value' }, timestamp: Date.now() - 70000, ttl: 60000, engine: 'google', paramsHash: 'abc123' };

    await cache.set(key, value);
    const result = await cache.get(key);

    expect(result).toBeNull();
  });

  it('should delete entries', async () => {
    const key = 'delete-key';
    const value = { data: { test: 'value' }, timestamp: Date.now(), ttl: 60000, engine: 'google', paramsHash: 'abc123' };

    await cache.set(key, value);
    await cache.delete(key);
    const result = await cache.get(key);

    expect(result).toBeNull();
  });

  it('should evict oldest entries when max size reached', async () => {
    const smallCache = new MemoryCache();
    (smallCache as any).cache = new Map();
    (smallCache as any).accessOrder = new Set();

    for (let i = 0; i < 505; i++) {
      await smallCache.set(`key-${i}`, { data: { i }, timestamp: Date.now(), ttl: 60000, engine: 'google', paramsHash: `hash-${i}` });
    }

    expect(smallCache.size()).toBeLessThanOrEqual(500);
  });
});

describe('createCacheKey', () => {
  it('should generate consistent keys for same params', () => {
    const params1 = { engine: 'google', q: 'test', location: 'Bangalore', gl: 'in' };
    const params2 = { engine: 'google', location: 'Bangalore', q: 'test', gl: 'in' };

    const key1 = createCacheKey('google', params1);
    const key2 = createCacheKey('google', params2);

    expect(key1).toBe(key2);
  });

  it('should generate different keys for different params', () => {
    const key1 = createCacheKey('google', { q: 'test1' });
    const key2 = createCacheKey('google', { q: 'test2' });

    expect(key1).not.toBe(key2);
  });

  it('should exclude api_key and no_cache from key', () => {
    const key1 = createCacheKey('google', { q: 'test', api_key: 'key1', no_cache: true });
    const key2 = createCacheKey('google', { q: 'test', api_key: 'key2', no_cache: false });

    expect(key1).toBe(key2);
  });
});

describe('createTieredCache', () => {
  it('should return MemoryCache when no KV provided', () => {
    const cache = createTieredCache();
    expect(cache).toBeInstanceOf(MemoryCache);
  });
});