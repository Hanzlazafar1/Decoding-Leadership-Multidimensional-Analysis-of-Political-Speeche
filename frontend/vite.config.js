import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Audio transcription (Vosk)
      '/upload-audio': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      // LLM analysis endpoints — match external API naming exactly
      '/classify': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/extract': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/summarize': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      // ── NEW: Chunked SSE analysis + agenda drill-down ──
      '/analyze-stream': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/agenda-detail': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
