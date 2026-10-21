import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://192.168.11.119:8080',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://192.168.11.119:8080',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    sourcemap: true,
    // Manual chunks disabled — was causing cross-chunk AnimatePresence crashes
    // rollupOptions: { output: { manualChunks: {...} } }
  },
})
