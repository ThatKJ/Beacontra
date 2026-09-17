/**
 * Centralized SerpApi Configuration Layer
 * 
 * Safe server-side configuration management for Cloudflare Workers, Hono, Node, and Vitest.
 * Standardizes on SERPAPI_API_KEY with backwards-compatible SERPAPI_KEY support.
 * 
 * Guarantees:
 * - API keys are NEVER exposed to client-side code
 * - API keys are NEVER logged or printed
 * - Error messages NEVER leak key values or partial fingerprints
 */

import process from 'node:process';

const CONFIG_ERROR_MESSAGE = 'SERPAPI_API_KEY is not configured.';
const DEFAULT_BASE_URL = 'https://serpapi.com/search.json';

/**
 * Validates a key string. Must be non-empty, non-whitespace, and not a template placeholder.
 */
function isValidKey(val: unknown): val is string {
  if (typeof val !== 'string') return false;
  const trimmed = val.trim();
  if (!trimmed) return false;
  if (
    trimmed === 'your_key_here' ||
    trimmed === 'your_api_key_here' ||
    trimmed === '<my real key>'
  ) {
    return false;
  }
  return true;
}

/**
 * Safely resolves the SerpApi API key from Worker environment bindings or process.env.
 * 
 * Throws a sanitized configuration error if missing. Never includes secrets in the error.
 */
export function getSerpApiKey(env?: Record<string, unknown>): string {
  // 1. Check Worker bindings if provided
  if (env) {
    const workerApiKey = env.SERPAPI_API_KEY ?? env.SERPAPI_KEY;
    if (isValidKey(workerApiKey)) {
      return workerApiKey.trim();
    }
  }

  // 2. Check process.env (Node / Vitest / CLI)
  try {
    if (typeof process !== 'undefined' && process && process.env) {
      const processKey = process.env.SERPAPI_API_KEY ?? process.env.SERPAPI_KEY;
      if (isValidKey(processKey)) {
        return processKey.trim();
      }
    }
  } catch {
    // Ignore environments where process is restricted
  }

  throw new Error(CONFIG_ERROR_MESSAGE);
}


/**
 * Safe boolean check: returns true if SerpApi is configured, false otherwise.
 * NEVER leaks the key, prefix, suffix, or fingerprints.
 */
export function isSerpApiConfigured(env?: Record<string, unknown>): boolean {
  try {
    const key = getSerpApiKey(env);
    return Boolean(key);
  } catch {
    return false;
  }
}

/**
 * Returns safe public configuration metadata for health checks.
 */
export function getSerpApiHealthStatus(env?: Record<string, unknown>): {
  configured: boolean;
  engineCount: number;
} {
  return {
    configured: isSerpApiConfigured(env),
    engineCount: 133,
  };
}

export const SERPAPI_BASE_URL = DEFAULT_BASE_URL;
