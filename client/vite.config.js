import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const API_TARGET = process.env.VITE_API_TARGET || 'http://localhost:7000'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': API_TARGET,
      '/robots.txt': API_TARGET,
      '/humans.txt': API_TARGET,
      '/admin': API_TARGET,
      '/member': API_TARGET,
      '/legacy-login': API_TARGET
    }
  }
})
