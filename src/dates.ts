// Date in formato yyyy-MM-dd riferite al fuso dell'attivita' (Europe/Rome), indipendenti dal fuso del browser.
const TZ = 'Europe/Rome';

export function todayInRome(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days, 12));
  return dt.toISOString().slice(0, 10);
}

const asNoonUtc = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
};

export const weekdayShort = (iso: string) =>
  new Intl.DateTimeFormat('it-IT', { weekday: 'short', timeZone: 'UTC' }).format(asNoonUtc(iso)).replace('.', '');

export const dayNumber = (iso: string) => String(Number(iso.slice(8, 10)));

export const monthShort = (iso: string) =>
  new Intl.DateTimeFormat('it-IT', { month: 'short', timeZone: 'UTC' }).format(asNoonUtc(iso)).replace('.', '');

const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

export const longDate = (iso: string) =>
  cap(new Intl.DateTimeFormat('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(asNoonUtc(iso)));


/** Data breve per spazi stretti: "Lun 12 ott" */
export const shortDate = (iso: string) => cap(`${weekdayShort(iso)} ${dayNumber(iso)} ${monthShort(iso)}`);
