// Configurazione della web app.
// Oggi serve una sola attivita' (Cavallo Vincenzo). In futuro (SaaS) qui si aggiungera' l'identificativo
// dell'attivita' (es. dal sottodominio o dal percorso) e l'API lo ricevera' in ogni richiesta.
export const config = {
  /** Base dello sportello n8n GOMMISTA-30-Web-API */
  apiBase: (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/+$/, '') || 'https://n8n.alemasat.com/webhook/gommista/v1',
  /** Giorni prenotabili mostrati nel calendario */
  daysAhead: 21,
  /** Timeout delle richieste (ms): la prenotazione passa da piu' workflow n8n */
  requestTimeoutMs: 30000,
};
