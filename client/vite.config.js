import { defineConfig } from 'vite';

export default defineConfig({
  // Read VITE_* variables from the single root .env file
  envDir: '..',
  server: {
    port: 5173,
    // Forward /api calls to the Express server during development
    proxy: { '/api': 'http://localhost:3001' },
  },
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 2000, // Phaser is big; that's fine
  },
});
