// Configurazione dell'attivita' scelta al momento della build (VITE_BUSINESS=<slug>, default cavadduzzu):
// vite.config.ts collega '@business-config' a src/business/configs/<slug>.json.
import config from '@business-config';
import type { BusinessConfig } from './types';

export const business = config as BusinessConfig;

/** Applica colori e caratteri della configurazione come variabili CSS e aggiorna titolo e meta della pagina */
export function applyBusinessTheme(b: BusinessConfig = business) {
  const root = document.documentElement.style;
  const t = b.theme;
  root.setProperty('--ink', t.ink);
  root.setProperty('--blue', t.primary);
  root.setProperty('--blue-dark', t.primaryDark);
  root.setProperty('--yellow', t.accent);
  root.setProperty('--red', t.accent2);
  root.setProperty('--green', t.accent3);
  root.setProperty('--mist', t.mist);
  root.setProperty('--line', t.line);
  root.setProperty('--muted', t.muted);
  root.setProperty('--display', `'${b.fonts.display}', Rockwell, Georgia, serif`);
  root.setProperty('--body', `'${b.fonts.body}', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`);
  document.title = `${b.name} – Prenota online`;
  document.querySelector('meta[name="description"]')?.setAttribute('content', b.description);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t.primary);
}
