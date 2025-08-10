import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Use 5173 to avoid conflict with Grafana (3000)
    port: 5173,
    proxy: {
      '/api': {
        // In local dev, proxy API calls directly to backend host mapping 8800.
        target: process.env.VITE_API_BASE || 'http://localhost:8800',
        changeOrigin: true,
      },
    },
  },
});
