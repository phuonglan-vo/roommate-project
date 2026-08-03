import { defineConfig } from 'vite';

const GITHUB_PAGES_BASE = '/roommate-project/';

function normalizeBasePath(value) {
  const normalizedValue = String(value ?? '').trim();

  if (!normalizedValue || normalizedValue === '/') {
    return '/';
  }

  return `/${normalizedValue.replace(/^\/+|\/+$/g, '')}/`;
}

function getBasePath() {
  if (process.env.BASE_PATH) {
    return normalizeBasePath(process.env.BASE_PATH);
  }

  if (process.env.GITHUB_ACTIONS === 'true') {
    return GITHUB_PAGES_BASE;
  }

  return '/';
}

export default defineConfig({
  base: getBasePath(),

  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true
  },

  preview: {
    host: '127.0.0.1',
    port: 4173,
    strictPort: true
  },

  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});