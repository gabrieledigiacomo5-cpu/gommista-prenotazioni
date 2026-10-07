# Web app di prenotazione (MVP)

Pagina pubblica dove il cliente sceglie servizio, giorno e orario, inserisce i suoi dati e prenota.
Non contiene logica di business: parla solo con il workflow n8n **GOMMISTA-30-Web-API**, che a sua volta
usa i workflow esistenti `10-Availability` (orari liberi) e `01-Create-Booking-V3` (prenotazione).

```
Web app → GET  /catalog       → servizi e sede
        → POST /availability  → orari liberi di un giorno (10)
        → POST /bookings      → prenotazione (01: ricontrollo, insert, verifica) → codice GM-…
```

Tecnologia: React + Vite + TypeScript, sito statico (nessun server).

## Comandi

```bash
npm install
npm run dev      # sviluppo su http://localhost:5173
npm run build    # sito pronto in dist/
```

## Configurazione

`src/config.ts` (indirizzo dello sportello n8n, giorni prenotabili, timeout).
L'indirizzo si può cambiare senza toccare il codice con la variabile `VITE_API_BASE` (vedi `.env.example`).

## Pubblicazione

`dist/` è un sito statico: si pubblica così com'è (Netlify, Cloudflare Pages, GitHub Pages, qualsiasi hosting).
Il modo più rapido: https://app.netlify.com/drop → trascinare la cartella `dist`.

Dopo la pubblicazione è consigliabile limitare il CORS del workflow 30 al dominio della web app
(opzione *Allowed Origins* dei tre nodi Webhook, oggi `*`).

## Verso il SaaS (non implementato)

Tutto ciò che riguarda l'attività arriva dall'API (`/catalog`). Per servire più attività basterà aggiungere
un identificativo dell'attività in `config.ts` (es. dal sottodominio) e passarlo all'API.
