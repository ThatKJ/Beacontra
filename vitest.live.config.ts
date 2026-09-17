import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        // Static assets are verified in-browser, not by this older test pool.
        miniflare: {
          compatibilityDate: '2024-10-01',
          compatibilityFlags: ['nodejs_compat'],
          kvNamespaces: ['CACHE_KV'],
        },
      },
    },
    include: ['tests/**/*.live.test.ts'],
    globals: true,
    environment: 'node',
  },
});
