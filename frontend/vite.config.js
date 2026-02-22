import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => ({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    allowedHosts: ['oklahoma-trainers-carriers-favorites.trycloudflare.com'],
  },
}));
