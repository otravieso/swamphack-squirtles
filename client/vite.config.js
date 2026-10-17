import { defineConfig } from 'vite';

export default defineConfig({
  envDir: '..', // read VITE_* values from the root .env
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:3001' }, // forward API calls to the server
  },
});
