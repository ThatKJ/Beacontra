import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import process from 'node:process';
import {
  getSerpApiKey,
  isSerpApiConfigured,
  getSerpApiHealthStatus,
} from '../src/lib/config';


describe('Centralized SerpApi Config Layer', () => {
  const originalApiKey = process.env.SERPAPI_API_KEY;
  const originalKey = process.env.SERPAPI_KEY;

  beforeEach(() => {
    (globalThis as any).process = process;
    delete process.env.SERPAPI_API_KEY;
    delete process.env.SERPAPI_KEY;
  });

  afterEach(() => {
    if (originalApiKey !== undefined) process.env.SERPAPI_API_KEY = originalApiKey;
    if (originalKey !== undefined) process.env.SERPAPI_KEY = originalKey;
  });

  it('should read SERPAPI_API_KEY from Worker env bindings', () => {
    const env = { SERPAPI_API_KEY: 'test-api-key-123' };
    expect(getSerpApiKey(env)).toBe('test-api-key-123');
    expect(isSerpApiConfigured(env)).toBe(true);
  });

  it('should support legacy SERPAPI_KEY as fallback in Worker env', () => {
    const env = { SERPAPI_KEY: 'legacy-key-456' };
    expect(getSerpApiKey(env)).toBe('legacy-key-456');
    expect(isSerpApiConfigured(env)).toBe(true);
  });

  it('should prefer SERPAPI_API_KEY over legacy SERPAPI_KEY when both exist', () => {
    const env = {
      SERPAPI_API_KEY: 'primary-key',
      SERPAPI_KEY: 'legacy-key',
    };
    expect(getSerpApiKey(env)).toBe('primary-key');
  });

  it('should read SERPAPI_API_KEY from process.env if env binding not provided', () => {
    process.env.SERPAPI_API_KEY = 'env-key-789';
    expect(getSerpApiKey()).toBe('env-key-789');
    expect(isSerpApiConfigured()).toBe(true);
  });



  it('should reject blank or whitespace-only keys', () => {
    const env = { SERPAPI_API_KEY: '   ' };
    expect(() => getSerpApiKey(env)).toThrow('SERPAPI_API_KEY is not configured.');
    expect(isSerpApiConfigured(env)).toBe(false);
  });

  it('should reject template placeholder keys', () => {
    const env = { SERPAPI_API_KEY: 'your_key_here' };
    expect(() => getSerpApiKey(env)).toThrow('SERPAPI_API_KEY is not configured.');
    expect(isSerpApiConfigured(env)).toBe(false);
  });

  it('should throw safe error message when key is missing and NEVER include secret in message', () => {
    expect(() => getSerpApiKey({})).toThrow('SERPAPI_API_KEY is not configured.');
    expect(() => getSerpApiKey()).toThrow('SERPAPI_API_KEY is not configured.');
  });

  it('should return safe health status without leaking key fingerprints', () => {
    const env = { SERPAPI_API_KEY: 'secret-token-abcdef' };
    const health = getSerpApiHealthStatus(env);
    expect(health.configured).toBe(true);
    expect(health.engineCount).toBe(133);
    // Ensure no key leaks in health JSON
    const serialized = JSON.stringify(health);
    expect(serialized).not.toContain('secret-token');
  });
});
