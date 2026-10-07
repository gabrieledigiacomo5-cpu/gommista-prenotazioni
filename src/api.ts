// Client dello sportello n8n (GOMMISTA-30-Web-API). Tutte le risposte hanno { ok, code?, message? }.
import { config } from './config';

export interface Location {
  location_id: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  maps_url: string;
}

export interface Service {
  service_id: string;
  name: string;
  description: string;
  price_info: string;
  duration_minutes: number;
  requires_plate: boolean;
  requires_tyre_size: boolean;
  location_ids: string[];
}

export interface Catalog {
  ok: true;
  business: { name: string; timezone: string };
  locations: Location[];
  services: Service[];
}

export interface SlotsResponse {
  ok: true;
  date: string;
  slots: { time: string }[];
  reason: string;
  message: string;
  next_available: { date: string; time: string }[];
}

export interface BookingRequest {
  service_id: string;
  location_id: string;
  date: string;
  time: string;
  first_name: string;
  last_name: string;
  phone: string;
  plate?: string;
  tyre_size?: string;
  website?: string; // campo trappola anti-bot: deve restare vuoto
}

export interface BookingSuccess {
  ok: true;
  code: 'booked' | 'already_booked';
  booking_id: string;
  message: string;
  booking: {
    service_name: string;
    location_name: string;
    address: string;
    phone: string;
    date: string;
    time: string;
  };
}

export interface ApiFailure {
  ok: false;
  code: string;
  message: string;
  fields?: string[];
  alternatives?: { date: string; time: string }[];
}

/** Errore di rete o risposta non leggibile: messaggio gia' pronto per l'utente */
export class ApiError extends Error {}

async function request<T>(path: string, init?: RequestInit): Promise<T | ApiFailure> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), config.requestTimeoutMs);
  try {
    const res = await fetch(`${config.apiBase}/${path}`, {
      ...init,
      signal: ctrl.signal,
      headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
    });
    const text = await res.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      throw new ApiError('Il servizio di prenotazione non risponde correttamente. Riprova tra poco.');
    }
    if (!data || typeof data !== 'object' || !('ok' in data)) {
      throw new ApiError('Il servizio di prenotazione non risponde correttamente. Riprova tra poco.');
    }
    return data as T | ApiFailure;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new ApiError('Il servizio sta impiegando troppo tempo. Riprova tra poco.');
    }
    throw new ApiError('Impossibile contattare il servizio di prenotazione. Controlla la connessione e riprova.');
  } finally {
    clearTimeout(timer);
  }
}

export const getCatalog = () => request<Catalog>('catalog');

export const getSlots = (service_id: string, location_id: string, date: string) =>
  request<SlotsResponse>('availability', { method: 'POST', body: JSON.stringify({ service_id, location_id, date }) });

export const createBooking = (body: BookingRequest) =>
  request<BookingSuccess>('bookings', { method: 'POST', body: JSON.stringify(body) });
