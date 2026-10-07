import { useEffect, useMemo, useState } from 'react';
import {
  ApiError, createBooking, getCatalog, getSlots,
  type BookingSuccess, type Catalog, type Location, type Service, type SlotsResponse,
} from './api';
import { config } from './config';
import { addDays, dayNumber, longDate, monthShort, todayInRome, weekdayShort } from './dates';

type Step = 'service' | 'datetime' | 'details' | 'done';

interface Details {
  first_name: string;
  last_name: string;
  phone: string;
  plate: string;
  tyre_size: string;
  website: string;
}

const emptyDetails: Details = { first_name: '', last_name: '', phone: '', plate: '', tyre_size: '', website: '' };

export default function App() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [loadError, setLoadError] = useState('');
  const [step, setStep] = useState<Step>('service');
  const [service, setService] = useState<Service | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [details, setDetails] = useState<Details>(emptyDetails);
  const [result, setResult] = useState<BookingSuccess | null>(null);

  const loadCatalog = () => {
    setLoadError('');
    getCatalog()
      .then(c => {
        if (!c.ok) throw new ApiError(c.message);
        setCatalog(c);
        if (c.locations.length === 1) setLocation(c.locations[0]);
        document.title = c.business.name ? `Prenota – ${c.business.name}` : 'Prenota un appuntamento';
      })
      .catch(e => setLoadError(e instanceof Error ? e.message : String(e)));
  };
  useEffect(loadCatalog, []);

  const restart = () => {
    setStep('service');
    setService(null);
    setDate('');
    setTime('');
    setDetails(emptyDetails);
    setResult(null);
  };

  const business = catalog?.business.name || '';
  const mainLocation = location || catalog?.locations[0] || null;

  return (
    <div className="page">
      <header className="header">
        <div className="header-inner">
          <h1>{business || 'Prenota un appuntamento'}</h1>
          {mainLocation && <p className="muted">{mainLocation.address}</p>}
        </div>
      </header>

      <main className="main">
        {!catalog && !loadError && <p className="muted center">Caricamento…</p>}
        {loadError && (
          <div className="card">
            <p className="error">{loadError}</p>
            <button className="btn" onClick={loadCatalog}>Riprova</button>
          </div>
        )}

        {catalog && step !== 'done' && <Progress step={step} />}

        {catalog && step === 'service' && (
          <ServiceStep
            catalog={catalog}
            location={location}
            onLocation={setLocation}
            onPick={s => { setService(s); setDate(''); setTime(''); setStep('datetime'); }}
          />
        )}

        {catalog && step === 'datetime' && service && location && (
          <DateTimeStep
            service={service}
            location={location}
            date={date}
            time={time}
            onDate={d => { setDate(d); setTime(''); }}
            onTime={t => { setTime(t); setStep('details'); }}
            onBack={() => setStep('service')}
          />
        )}

        {catalog && step === 'details' && service && location && (
          <DetailsStep
            service={service}
            location={location}
            date={date}
            time={time}
            details={details}
            onChange={setDetails}
            onBack={() => setStep('datetime')}
            onSlotTaken={() => { setTime(''); setStep('datetime'); }}
            onDone={r => { setResult(r); setStep('done'); }}
          />
        )}

        {step === 'done' && result && <DoneStep result={result} onAgain={restart} />}
      </main>

      <footer className="footer muted">
        {mainLocation?.phone && <>Per informazioni: <a href={`tel:${mainLocation.phone.replace(/\s/g, '')}`}>{mainLocation.phone}</a></>}
      </footer>
    </div>
  );
}

function Progress({ step }: { step: Step }) {
  const steps: [Step, string][] = [['service', 'Servizio'], ['datetime', 'Giorno e ora'], ['details', 'I tuoi dati']];
  const current = steps.findIndex(([s]) => s === step);
  return (
    <ol className="progress">
      {steps.map(([s, label], i) => (
        <li key={s} className={i < current ? 'done' : i === current ? 'current' : ''}>
          <span className="dot">{i + 1}</span> {label}
        </li>
      ))}
    </ol>
  );
}

function ServiceStep({ catalog, location, onLocation, onPick }: {
  catalog: Catalog;
  location: Location | null;
  onLocation: (l: Location) => void;
  onPick: (s: Service) => void;
}) {
  const services = location ? catalog.services.filter(s => s.location_ids.includes(location.location_id)) : [];
  return (
    <section>
      {catalog.locations.length > 1 && (
        <>
          <h2>Scegli la sede</h2>
          <div className="chips">
            {catalog.locations.map(l => (
              <button key={l.location_id} className={`chip ${location?.location_id === l.location_id ? 'selected' : ''}`} onClick={() => onLocation(l)}>
                {l.name}
              </button>
            ))}
          </div>
        </>
      )}
      <h2>Quale servizio ti serve?</h2>
      {location && services.length === 0 && <p className="muted">Nessun servizio prenotabile online in questa sede.</p>}
      <div className="list">
        {services.map(s => (
          <button key={s.service_id} className="service" onClick={() => onPick(s)}>
            <span className="service-name">{s.name}</span>
            {s.description && <span className="muted small">{s.description}</span>}
            <span className="muted small">Durata indicativa: {s.duration_minutes} min{s.price_info ? ` · ${s.price_info}` : ''}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function DateTimeStep({ service, location, date, time, onDate, onTime, onBack }: {
  service: Service;
  location: Location;
  date: string;
  time: string;
  onDate: (d: string) => void;
  onTime: (t: string) => void;
  onBack: () => void;
}) {
  const days = useMemo(() => {
    const start = todayInRome();
    return Array.from({ length: config.daysAhead }, (_, i) => addDays(start, i));
  }, []);
  const [slots, setSlots] = useState<SlotsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!date) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    setSlots(null);
    getSlots(service.service_id, location.location_id, date)
      .then(r => {
        if (cancelled) return;
        if (!r.ok) setError(r.message);
        else setSlots(r);
      })
      .catch(e => { if (!cancelled) setError(e instanceof Error ? e.message : String(e)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [date, service.service_id, location.location_id]);

  return (
    <section>
      <button className="link" onClick={onBack}>← Cambia servizio</button>
      <h2>{service.name}: scegli il giorno</h2>
      <div className="days">
        {days.map(d => (
          <button key={d} className={`day ${d === date ? 'selected' : ''}`} onClick={() => onDate(d)}
            ref={el => { if (el && d === date) el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' }); }}>
            <span className="small">{weekdayShort(d)}</span>
            <strong>{dayNumber(d)}</strong>
            <span className="small">{monthShort(d)}</span>
          </button>
        ))}
      </div>

      {date && (
        <>
          <h2>Orari liberi: {longDate(date)}</h2>
          {loading && <p className="muted">Cerco gli orari liberi…</p>}
          {error && <p className="error">{error}</p>}
          {slots && slots.slots.length > 0 && (
            <div className="slots">
              {slots.slots.map(s => (
                <button key={s.time} className={`chip ${s.time === time ? 'selected' : ''}`} onClick={() => onTime(s.time)}>
                  {s.time}
                </button>
              ))}
            </div>
          )}
          {slots && slots.slots.length === 0 && (
            <div className="notice">
              <p>{slots.message || 'Non ci sono orari liberi in questa data.'}</p>
              {slots.next_available.length > 0 && slots.next_available[0].date !== date && (
                <button className="btn secondary" onClick={() => onDate(slots.next_available[0].date)}>
                  Primo giorno disponibile: {longDate(slots.next_available[0].date)}
                </button>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}

function DetailsStep({ service, location, date, time, details, onChange, onBack, onSlotTaken, onDone }: {
  service: Service;
  location: Location;
  date: string;
  time: string;
  details: Details;
  onChange: (d: Details) => void;
  onBack: () => void;
  onSlotTaken: () => void;
  onDone: (r: BookingSuccess) => void;
}) {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [badFields, setBadFields] = useState<string[]>([]);
  const [slotTaken, setSlotTaken] = useState(false);
  const set = (k: keyof Details) => (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...details, [k]: e.target.value });
    if (badFields.includes(k)) setBadFields(badFields.filter(f => f !== k));
    if (error && !slotTaken) setError('');
  };

  // Controllo minimo prima dell'invio (il controllo vero lo fa sempre il server)
  const missing = (): string[] => {
    const m: string[] = [];
    if (details.first_name.trim().length < 2) m.push('first_name');
    if (details.last_name.trim().length < 2) m.push('last_name');
    if (details.phone.replace(/\D/g, '').length < 8) m.push('phone');
    if (service.requires_tyre_size && !details.tyre_size.trim()) m.push('tyre_size');
    if (service.requires_plate && details.plate.replace(/[^A-Za-z0-9]/g, '').length < 5) m.push('plate');
    return m;
  };
  const LABELS: Record<string, string> = { first_name: 'nome', last_name: 'cognome', phone: 'telefono', tyre_size: 'misura degli pneumatici', plate: 'targa' };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;
    setSlotTaken(false);
    const m = missing();
    if (m.length) {
      setBadFields(m);
      setError(`Controlla questi campi: ${m.map(f => LABELS[f]).join(', ')}.`);
      return;
    }
    setSending(true);
    setError('');
    setBadFields([]);
    try {
      const r = await createBooking({
        service_id: service.service_id,
        location_id: location.location_id,
        date,
        time,
        first_name: details.first_name.trim(),
        last_name: details.last_name.trim(),
        phone: details.phone.trim(),
        plate: service.requires_plate ? details.plate.trim() : undefined,
        tyre_size: service.requires_tyre_size ? details.tyre_size.trim() : undefined,
        website: details.website,
      });
      if (r.ok) { onDone(r); return; }
      setError(r.message);
      setBadFields(r.fields || []);
      if (r.code === 'slot_unavailable') setSlotTaken(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSending(false);
    }
  };

  const invalid = (f: string) => (badFields.includes(f) ? 'invalid' : '');

  return (
    <section>
      <button className="link" onClick={onBack}>← Cambia giorno o orario</button>
      <div className="summary">
        <strong>{service.name}</strong>
        <span>{longDate(date)} alle {time}</span>
        <span className="muted small">{location.name} – {location.address}</span>
      </div>

      <h2>I tuoi dati</h2>
      <form onSubmit={submit} noValidate>
        <div className="row">
          <label>Nome
            <input className={invalid('first_name')} value={details.first_name} onChange={set('first_name')} autoComplete="given-name" required maxLength={40} />
          </label>
          <label>Cognome
            <input className={invalid('last_name')} value={details.last_name} onChange={set('last_name')} autoComplete="family-name" required maxLength={40} />
          </label>
        </div>
        <label>Telefono
          <input className={invalid('phone')} type="tel" inputMode="tel" value={details.phone} onChange={set('phone')} autoComplete="tel" placeholder="es. 333 123 4567" required maxLength={20} />
        </label>
        {service.requires_tyre_size && (
          <label>Misura degli pneumatici
            <input className={invalid('tyre_size')} value={details.tyre_size} onChange={set('tyre_size')} placeholder="es. 205/55 R16 (scritta sul fianco della gomma)" required maxLength={30} />
          </label>
        )}
        {service.requires_plate && (
          <label>Targa del veicolo
            <input className={invalid('plate')} value={details.plate} onChange={set('plate')} placeholder="es. AB123CD" required maxLength={12} autoCapitalize="characters" />
          </label>
        )}
        {/* Campo trappola per i bot: invisibile alle persone */}
        <input className="hp" tabIndex={-1} autoComplete="off" value={details.website} onChange={set('website')} aria-hidden="true" />

        {error && <p className="error">{error}</p>}
        {slotTaken && <button type="button" className="btn secondary" onClick={onSlotTaken}>Scegli un altro orario</button>}

        <button className="btn primary" type="submit" disabled={sending}>
          {sending ? 'Prenotazione in corso…' : 'Prenota'}
        </button>
        <p className="muted small">I dati servono solo a gestire l'appuntamento.</p>
      </form>
    </section>
  );
}

function DoneStep({ result, onAgain }: { result: BookingSuccess; onAgain: () => void }) {
  const b = result.booking;
  return (
    <section className="card done">
      <div className="check" aria-hidden="true">✓</div>
      <h2>Prenotazione confermata</h2>
      <p className="code">Codice: <strong>{result.booking_id}</strong></p>
      <p><strong>{b.service_name}</strong><br />{longDate(b.date)} alle {b.time}</p>
      <p className="muted">{b.location_name} – {b.address}</p>
      {b.phone && <p className="muted small">Per spostare o annullare chiama il <a href={`tel:${b.phone.replace(/\s/g, '')}`}>{b.phone}</a> indicando il codice.</p>}
      <button className="btn secondary" onClick={onAgain}>Nuova prenotazione</button>
    </section>
  );
}
