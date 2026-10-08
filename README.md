# Web app di prenotazione

Pagina pubblica dove il cliente sceglie servizio, giorno e orario, inserisce i suoi dati e prenota.
Non contiene logica di business: parla solo con il workflow n8n **GOMMISTA-30-Web-API**, che usa i workflow
esistenti `10-Availability` (orari liberi) e `01-Create-Booking-V3` (prenotazione) e avvisa lo staff con il `20`.

```
Web app → GET  /webhook/<slug>/v1/catalog       → servizi e sede
        → POST /webhook/<slug>/v1/availability  → orari liberi di un giorno (10)
        → POST /webhook/<slug>/v1/bookings      → prenotazione (01) → codice GM-… → avviso allo staff (20)
```

Tecnologia: React + Vite + TypeScript, sito statico (nessun server). Oggi pubblicata su
https://gabrieledigiacomo5-cpu.github.io/gommista-prenotazioni/ (attività: **Cavadduzzu**).

## Una web app, più attività

Tutto ciò che distingue un'attività sta in **`src/business/configs/<slug>.json`** (nome, mestiere, titolari,
emblema, colori, caratteri, funzioni come la gomma 3D, informativa privacy, indirizzo dello sportello n8n).
Il file si genera da `businesses/<slug>/business.json` con `node tools/new-business.js <slug>` (vedi `GENERATORE.md`
nella radice del progetto). Contatti, servizi e orari arrivano sempre dall'API.

```bash
npm install
npm run dev                                   # Cavadduzzu (predefinita) su http://localhost:5173
VITE_BUSINESS=esempio-barbiere npm run dev    # un'altra attività
VITE_BUSINESS=<slug> npm run build            # sito pronto in dist/ (contiene solo quella attività)
```

Caratteri: inclusi nel sito con `@fontsource` (nessuna richiesta a Google). Per caratteri diversi:
`npm install @fontsource/<nome>` e aggiungere gli import in `src/business/fonts.ts`.

## Animazioni

La gomma 3D (three.js, caricato dopo la pagina, `features.hero3d = "tyre"`) e la ruota che rotola sulla fascia
(`features.rollingBand`) rispettano l'impostazione di sistema "riduci animazioni": in quel caso si vede l'emblema fermo.
Per provarle comunque aggiungere `?motion` all'indirizzo.

## Pubblicazione (GitHub Pages)

`dist/` è un sito statico. Oggi: sorgente sul ramo `main` di `gabrieledigiacomo5-cpu/gommista-prenotazioni`,
sito sul ramo `gh-pages` (in `dist/`: `git init -b gh-pages`, commit, `git push -f <repo> gh-pages`, poi eliminare `dist/.git`).
Se il sito cambia indirizzo, aggiornare `n8n.webOrigins` in `business.json` (CORS) e ripubblicare il workflow 30.
