// Impostazioni tecniche della web app. L'attivita' (nome, colori, sportello n8n) e' in src/business/configs/<slug>.json.
import { business } from './business';

export const config = {
  /** Base dello sportello n8n GOMMISTA-30-Web-API (VITE_API_BASE la sovrascrive) */
  apiBase: (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/+$/, '') || business.apiBase.replace(/\/+$/, ''),
  /** Giorni prenotabili mostrati nel calendario */
  daysAhead: 21,
  /** Timeout delle richieste (ms): la prenotazione passa da piu' workflow n8n */
  requestTimeoutMs: 30000,
};
