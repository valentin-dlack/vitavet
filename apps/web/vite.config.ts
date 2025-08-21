import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Load env from monorepo root so both apps share the same .env
  envDir: '../../',
  server: (() => {
    const hasAbsoluteApi = !!process.env.VITE_API_BASE_URL
    if (hasAbsoluteApi) return {}
    return {
      proxy: {
        '/api': {
          target: process.env.VITE_API_PROXY_TARGET || 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
        },
      },
    }
  })(),
  preview: {
    allowedHosts: true,
  },
})
