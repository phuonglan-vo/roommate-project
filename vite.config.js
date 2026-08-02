import { defineConfig } from 'vite';

function getBasePath() {
  if (process.env.BASE_PATH) {
    return process.env.BASE_PATH;
  }

  const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1];

  if (
    process.env.GITHUB_ACTIONS === 'true' &&
    repositoryName &&
    !repositoryName.endsWith('.github.io')
  ) {
    return `/${repositoryName}/`;
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