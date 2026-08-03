import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
  /*
   * npm run dev:
   * http://127.0.0.1:5173/
   *
   * npm run build và npm run preview:
   * /roommate-project/
   */
  base:
    mode === 'development'
      ? '/'
      : '/roommate-project/',

  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true
  },

  preview: {
    host: '127.0.0.1',
    port: 4174,
    strictPort: true
  },

  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
}));