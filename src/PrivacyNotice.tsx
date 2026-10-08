// Informativa privacy breve (art. 13 GDPR) generata dalla configurazione dell'attivita'.
// Si apre con il link "#privacy" (piede della pagina e modulo). Finche' privacy.confirmed e' false e' marcata come bozza.
import { useEffect, useRef } from 'react';
import { business } from './business';

export default function PrivacyNotice() {
  const dialog = useRef<HTMLDialogElement>(null);
  const p = business.privacy;

  useEffect(() => {
    const sync = () => {
      const d = dialog.current;
      if (!d) return;
      if (window.location.hash === '#privacy' && !d.open) d.showModal();
      if (window.location.hash !== '#privacy' && d.open) d.close();
    };
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  const close = () => {
    if (window.location.hash === '#privacy') history.replaceState(null, '', window.location.pathname + window.location.search);
    dialog.current?.close();
  };

  return (
    <>
      <a href="#privacy">Informativa privacy</a>
      <dialog ref={dialog} className="privacy" onClose={close} aria-labelledby="privacy-title">
        <h2 id="privacy-title">Informativa privacy</h2>
        {!p.confirmed && <p className="privacy-draft">Bozza in attesa di conferma da parte del titolare.</p>}
        <p><strong>Chi tratta i dati.</strong> {p.controller}, che puoi contattare tramite {p.contact}.</p>
        <p><strong>Quali dati.</strong> Nome, cognome, numero di telefono e, solo per alcuni servizi, targa del veicolo o misura degli pneumatici.</p>
        <p><strong>Perché.</strong> Per registrare e gestire il tuo appuntamento e, se serve, contattarti per spostarlo o confermarlo. La base giuridica è l'esecuzione della tua richiesta (art. 6.1.b GDPR).</p>
        <p><strong>Per quanto tempo.</strong> Per {p.retention}.</p>
        <p><strong>Chi li vede.</strong> Solo il personale dell'attività e i fornitori tecnici che ospitano il sistema di prenotazione, che agiscono per conto del titolare. I dati non vengono venduti né usati per pubblicità.</p>
        <p><strong>I tuoi diritti.</strong> Puoi chiedere di vedere, correggere o cancellare i tuoi dati, limitarne l'uso o opporti, contattando il titolare. Puoi anche presentare reclamo al Garante per la protezione dei dati personali.</p>
        <button type="button" className="btn btn-dark" onClick={close}>Chiudi</button>
      </dialog>
    </>
  );
}
