import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
  const base =
    process.env.BASE_PATH ??
    (mode === 'development'
      ? '/'
      : '/roommate-project/');

  return {
    base,

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
  };
});