import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        // This older test pool bundles a Wrangler that predates Static Assets.
        // Unit tests exercise the Worker services; browser checks cover assets.
        miniflare: {
          compatibilityDate: '2024-10-01',
          compatibilityFlags: ['nodejs_compat'],
          kvNamespaces: ['CACHE_KV'],
        },
      },
    },
    include: ['tests/**/*.test.ts'],
    globals: true,
    environment: 'node',
  },
});
