import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
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
})
