import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// base './': percorsi relativi, cosi' il sito funziona anche in una sottocartella (es. GitHub Pages /<repo>/)
export default defineConfig({
  base: './',
  plugins: [react()],
})
