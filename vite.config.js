import { defineConfig } from 'vite';

export default defineConfig(({ command }) => ({
  /*
   * Local:
   * http://127.0.0.1:5173/
   *
   * GitHub Pages:
   * https://phuonglan-vo.github.io/roommate-project/
   */
  base:
    command === 'build'
      ? '/roommate-project/'
      : '/',

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
}));