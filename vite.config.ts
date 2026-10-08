import react from '@vitejs/plugin-react'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
// base './': percorsi relativi, cosi' il sito funziona anche in una sottocartella (es. GitHub Pages /<repo>/).
// VITE_BUSINESS=<slug> sceglie l'attivita': nel sito finisce SOLO la sua configurazione (src/business/configs/<slug>.json).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const slug = process.env.VITE_BUSINESS || env.VITE_BUSINESS || 'cavadduzzu'
  const file = fileURLToPath(new URL(`./src/business/configs/${slug}.json`, import.meta.url))
  if (!existsSync(file)) throw new Error(`Configurazione non trovata per l'attivita' "${slug}" (${file})`)
  const biz = JSON.parse(readFileSync(file, 'utf8'))
  const esc = (v: string) => String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
  return {
    base: './',
    plugins: [react(), {
      name: 'business-html',
      // titolo, descrizione e colore della barra del browser gia' nell'HTML (prima che parta JavaScript)
      transformIndexHtml: (html: string) => html
        .replace(/%BUSINESS_TITLE%/g, esc(`${biz.name} – Prenota online`))
        .replace(/%BUSINESS_DESCRIPTION%/g, esc(biz.description))
        .replace(/%BUSINESS_COLOR%/g, esc(biz.theme.primary)),
    }],
    resolve: { alias: { '@business-config': file } },
  }
})
