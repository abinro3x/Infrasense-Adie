
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.VITE_API_KEY)
  },
  server: {
    port: 3000,
    strictPort: true, // Ensure it fails if 3000 is busy rather than picking random port
    host: true, // Listen on all local IPs
    proxy: {
      // Proxy /api/ollama requests to the local Ollama instance
      '/api/ollama': {
        target: 'http://localhost:11434',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ollama/, ''),
        secure: false,
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          recharts: ['recharts'],
          genai: ['@google/genai']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})