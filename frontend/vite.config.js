import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    headers: {
      'Cross-Origin-Opener-Policy': 'unsafe-none',
      'Cross-Origin-Embedder-Policy': 'unsafe-none',
    },
    allowedHosts: [
      '.ngrok-free.app', // permite cualquier subdominio de ngrok
    ],
    proxy: {
      '/Proyecto_web_Agro': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/Proyecto_web_Agro/, ''),
      },
    },
  }
});