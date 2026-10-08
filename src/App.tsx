import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ApiError, createBooking, getCatalog, getSlots,
  type BookingSuccess, type Catalog, type Location, type Service, type SlotsResponse,
} from './api';
import { brand } from './brand';
import { downloadIcs } from './calendar';
import { config } from './config';
import { addDays, dayNumber, longDate, lowerDate, monthShort, shortDate, todayInRome, weekdayShort } from './dates';
import { CalendarIcon, PhoneIcon, PinIcon, ServiceIcon } from './icons';
import RollingBand from './RollingBand';
import TyreScene from './TyreScene';

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
const telHref = (p: string) => `tel:${p.replace(/[^\d+]/g, '')}`;

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
  const bookingRef = useRef<HTMLElement>(null);

  const loadCatalog = () => {
    setLoadError('');
    getCatalog()
      .then(c => {
        if (!c.ok) throw new ApiError(c.message);
        setCatalog(c);
        if (c.locations.length === 1) setLocation(c.locations[0]);
      })
      .catch(e => setLoadError(e instanceof Error ? e.message : String(e)));
  };
  useEffect(loadCatalog, []);

  // A ogni cambio di passo si riporta in vista l'inizio del riquadro di prenotazione
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    bookingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [step]);

  const restart = () => {
    setStep('service');
    setService(null);
    setDate('');
    setTime('');
    setDetails(emptyDetails);
    setResult(null);
  };

  const place = location || catalog?.locations[0] || null;

  return (
    <div className="app">
      <header className="hero">
        <TyreScene />
        <div className="wrap hero-inner">
          <div className="hero-text">
            <h1>{brand.name}</h1>
            <p className="trade">{brand.tagline}{place?.city ? ` a ${place.city}` : ''}</p>
            <p className="people">{brand.people}</p>
          </div>
          <div className="hero-actions">
            <a className="btn btn-signal" href="#prenota">Prenota online</a>
            {place?.phone && <a className="btn btn-ghost" href={telHref(place.phone)}><PhoneIcon /> Chiama</a>}
          </div>
          {place && (
            <a className="hero-address" href={place.maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.address)}`} target="_blank" rel="noopener noreferrer">
              <PinIcon /> {place.address}
            </a>
          )}
        </div>
      </header>

      <main className="wrap" id="prenota" ref={bookingRef}>
        <section className="panel" aria-live="polite">
          {!catalog && !loadError && <p className="muted center pad">Caricamento dei servizi…</p>}
          {loadError && (
            <div className="pad">
              <p className="error">{loadError}</p>
              <button className="btn btn-dark" onClick={loadCatalog}>Riprova</button>
            </div>
          )}

          {catalog && step !== 'done' && (
            <PanelHead step={step} service={service} date={date} time={time}
              onGo={s => setStep(s)} />
          )}

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
              onSlotTaken={() => { setTime(''); setStep('datetime'); }}
              onDone={r => { setResult(r); setStep('done'); }}
            />
          )}

          {step === 'done' && result && service && <DoneStep result={result} service={service} mapsUrl={place?.maps_url || ''} onAgain={restart} />}
        </section>
      </main>

      <RollingBand />

      <footer className="footer">
        <div className="wrap footer-inner">
          <strong>{brand.name}</strong>
          {place && <span>{place.address}</span>}
          {place?.phone && <a href={telHref(place.phone)}>Tel. {place.phone}</a>}
        </div>
      </footer>
    </div>
  );
}

function PanelHead({ step, service, date, time, onGo }: {
  step: Step;
  service: Service | null;
  date: string;
  time: string;
  onGo: (s: Step) => void;
}) {
  const steps: [Step, string][] = [['service', 'Servizio'], ['datetime', 'Giorno e ora'], ['details', 'I tuoi dati']];
  const current = steps.findIndex(([s]) => s === step);
  return (
    <div className="panel-head">
      <h2 className="panel-title">Prenota un appuntamento</h2>
      <ol className="steps">
        {steps.map(([s, label], i) => (
          <li key={s} className={i < current ? 'done' : i === current ? 'current' : ''}>
            {i < current
              ? <button type="button" onClick={() => onGo(s)}><span className="num">{i + 1}</span>{label}</button>
              : <span><span className="num">{i + 1}</span>{label}</span>}
          </li>
        ))}
      </ol>
      {current > 0 && service && (
        <p className="choice">
          <strong>{service.name}</strong>
          {date && time && current > 1 && <>, {lowerDate(date)} alle {time}</>}
        </p>
      )}
    </div>
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
    <div className="pad">
      {catalog.locations.length > 1 && (
        <>
          <h3>Scegli la sede</h3>
          <div className="chips">
            {catalog.locations.map(l => (
              <button key={l.location_id} className={`chip ${location?.location_id === l.location_id ? 'selected' : ''}`} onClick={() => onLocation(l)}>
                {l.name}
              </button>
            ))}
          </div>
        </>
      )}
      <h3>Di cosa hai bisogno?</h3>
      {location && services.length === 0 && <p className="muted">Nessun servizio prenotabile online in questa sede.</p>}
      <div className="services">
        {services.map(s => (
          <button key={s.service_id} className="service" onClick={() => onPick(s)}>
            <span className="service-icon"><ServiceIcon id={s.service_id} /></span>
            <span className="service-body">
              <span className="service-name">{s.name}</span>
              {s.description && <span className="service-desc">{s.description}</span>}
            </span>
            <span className="service-time">{s.duration_minutes}<small>min</small></span>
          </button>
        ))}
      </div>
    </div>
  );
}

function DateTimeStep({ service, location, date, time, onDate, onTime }: {
  service: Service;
  location: Location;
  date: string;
  time: string;
  onDate: (d: string) => void;
  onTime: (t: string) => void;
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
    <div className="pad">
      <h3>Scegli il giorno</h3>
      <div className="days" role="listbox" aria-label="Giorni">
        {days.map(d => (
          <button key={d} role="option" aria-selected={d === date} aria-label={longDate(d)} className={`day ${d === date ? 'selected' : ''}`} onClick={() => onDate(d)}
            ref={el => { if (el && d === date) el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' }); }}>
            <span className="day-week">{weekdayShort(d)}</span>
            <span className="day-num">{dayNumber(d)}</span>
            <span className="day-month">{monthShort(d)}</span>
          </button>
        ))}
      </div>

      {!date && <p className="hint">Tocca un giorno per vedere gli orari liberi.</p>}
      {date && (
        <>
          <h3>Orari liberi per {lowerDate(date)}</h3>
          {loading && <div className="slots skeleton" aria-label="Caricamento orari">{Array.from({ length: 8 }, (_, i) => <span key={i} />)}</div>}
          {error && <p className="error">{error}</p>}
          {slots && slots.slots.length > 0 && (
            <div className="slots">
              {slots.slots.map(s => (
                <button key={s.time} className={`slot ${s.time === time ? 'selected' : ''}`} onClick={() => onTime(s.time)}>
                  {s.time}
                </button>
              ))}
            </div>
          )}
          {slots && slots.slots.length === 0 && (
            <div className="notice">
              <p>{slots.message || 'Non ci sono orari liberi in questa data.'}</p>
              {slots.next_available.length > 0 && slots.next_available[0].date !== date && (
                <button className="btn btn-dark" onClick={() => onDate(slots.next_available[0].date)}>
                  Vai al primo giorno libero: {longDate(slots.next_available[0].date)}
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function DetailsStep({ service, location, date, time, details, onChange, onSlotTaken, onDone }: {
  service: Service;
  location: Location;
  date: string;
  time: string;
  details: Details;
  onChange: (d: Details) => void;
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
    <form id="booking-form" className="pad form" onSubmit={submit} noValidate>
      <h3>I tuoi dati</h3>
      <div className="row">
        <label>Nome
          <input className={invalid('first_name')} value={details.first_name} onChange={set('first_name')} autoComplete="given-name" maxLength={40} />
        </label>
        <label>Cognome
          <input className={invalid('last_name')} value={details.last_name} onChange={set('last_name')} autoComplete="family-name" maxLength={40} />
        </label>
      </div>
      <label>Telefono
        <input className={invalid('phone')} type="tel" inputMode="tel" value={details.phone} onChange={set('phone')} autoComplete="tel" placeholder="es. 333 123 4567" maxLength={20} />
        <span className="field-help">Ti contattiamo solo per questo appuntamento.</span>
      </label>
      {service.requires_tyre_size && (
        <label>Misura degli pneumatici
          <input className={invalid('tyre_size')} value={details.tyre_size} onChange={set('tyre_size')} placeholder="es. 205/55 R16" maxLength={30} />
          <span className="field-help">La trovi scritta sul fianco della gomma.</span>
        </label>
      )}
      {service.requires_plate && (
        <label>Targa del veicolo
          <input className={invalid('plate')} value={details.plate} onChange={set('plate')} placeholder="es. AB123CD" maxLength={12} autoCapitalize="characters" />
        </label>
      )}
      {/* Campo trappola per i bot: invisibile alle persone */}
      <input className="hp" tabIndex={-1} autoComplete="off" value={details.website} onChange={set('website')} aria-hidden="true" name="website" />

      {error && <p className="error" role="alert">{error}</p>}
      {slotTaken && <button type="button" className="btn btn-dark" onClick={onSlotTaken}>Scegli un altro orario</button>}

      <div className="submit-bar">
        <div className="submit-summary">
          <strong>{service.name}</strong>
          <span>{shortDate(date)} alle {time}</span>
        </div>
        <button className="btn btn-signal btn-big" type="submit" disabled={sending}>
          {sending ? 'Prenotazione in corso…' : 'Prenota'}
        </button>
      </div>
    </form>
  );
}

function DoneStep({ result, service, mapsUrl, onAgain }: { result: BookingSuccess; service: Service; mapsUrl: string; onAgain: () => void }) {
  const b = result.booking;
  return (
    <div className="pad done">
      <div className="ticket">
        <div className="ticket-top">
          <span className="ticket-ok" aria-hidden="true">✓</span>
          <div>
            <h2>Prenotazione confermata</h2>
            <p className="muted">Ti aspettiamo!</p>
          </div>
        </div>
        <dl className="ticket-body">
          <div><dt>Servizio</dt><dd>{b.service_name}</dd></div>
          <div><dt>Quando</dt><dd>{longDate(b.date)} alle {b.time}</dd></div>
          <div><dt>Dove</dt><dd>{b.address}</dd></div>
        </dl>
        <div className="ticket-code">
          <span>Codice prenotazione</span>
          <strong>{result.booking_id}</strong>
        </div>
      </div>

      <div className="done-actions">
        <button className="btn btn-dark" onClick={() => downloadIcs({
          code: result.booking_id,
          title: `${b.service_name} – ${brand.name}`,
          date: b.date,
          time: b.time,
          minutes: service.duration_minutes,
          location: b.address,
          description: `Codice prenotazione: ${result.booking_id}${b.phone ? `\nPer spostare o annullare: ${b.phone}` : ''}`,
        })}><CalendarIcon /> Aggiungi al calendario</button>
        {mapsUrl && <a className="btn btn-outline" href={mapsUrl} target="_blank" rel="noopener noreferrer"><PinIcon /> Indicazioni</a>}
        {b.phone && <a className="btn btn-outline" href={telHref(b.phone)}><PhoneIcon /> Chiama</a>}
      </div>
      {b.phone && <p className="muted small">Per spostare o annullare chiama il {b.phone} indicando il codice.</p>}
      <button className="link" onClick={onAgain}>Fai un'altra prenotazione</button>
    </div>
  );
}
