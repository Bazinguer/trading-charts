import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // En desarrollo la API corre aparte (make api); en producción
    // FastAPI sirve este build y el proxy no existe.
    proxy: { '/api': 'http://localhost:8010' },
  },
})
