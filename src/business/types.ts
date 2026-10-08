// Configurazione di un'attivita' per la web app di prenotazione.
// Un file JSON per attivita' in src/business/configs/<slug>.json (generato da tools/new-business.js).
// Contatti, servizi e orari liberi NON stanno qui: arrivano sempre dall'API n8n (/catalog, /availability).
export interface BusinessConfig {
  slug: string;
  name: string;            // nome mostrato (es. "Cavadduzzu")
  trade: string;           // mestiere (es. "Gommista"): la citta' arriva dall'API
  people?: string;         // es. "Vincenzo Cavallo con i figli Ignazio e Gaudenzio"
  emblem: string;          // immagine in public/ (logo o emblema), es. "./ruota.svg"
  description: string;     // meta description
  apiBase: string;         // sportello n8n, es. https://n8n.example.com/webhook/<slug>/v1
  theme: {
    ink: string;           // testo
    primary: string;       // struttura e azioni
    primaryDark: string;
    accent: string;        // evidenze (passo corrente, orario scelto)
    accent2: string;       // colore secondario decorativo
    accent3: string;       // terzo colore decorativo
    mist: string;          // fondo tenue
    line: string;          // bordi
    muted: string;         // testo secondario
  };
  fonts: { display: string; body: string };
  features: {
    hero3d: 'tyre' | 'none';   // oggetto 3D nella testata (three.js, caricato dopo la pagina)
    rollingBand: boolean;      // fascia decorativa con la ruota che rotola
  };
  privacy: {
    controller: string;        // titolare del trattamento (nome e ragione sociale)
    contact: string;           // come contattarlo (telefono o email)
    retention: string;         // per quanto si conservano i dati
    confirmed: boolean;        // false = bozza: la pagina lo dice chiaramente
  };
}
