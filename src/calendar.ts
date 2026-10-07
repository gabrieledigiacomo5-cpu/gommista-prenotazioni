// File .ics per aggiungere l'appuntamento al calendario del telefono (generato nel browser, nessun invio di dati).
const pad = (n: number) => String(n).padStart(2, '0');

/** Orario locale Europe/Rome -> stringa UTC per iCalendar (yyyyMMddTHHmmssZ) */
function romeToUtcStamp(date: string, time: string, plusMinutes = 0): string {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  // Differenza tra Roma e UTC in quel momento (gestisce ora legale/solare)
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  const romeParts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Rome', hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    .formatToParts(new Date(guess))
    .reduce<Record<string, number>>((a, p) => (p.type !== 'literal' ? { ...a, [p.type]: Number(p.value) } : a), {});
  const romeAsUtc = Date.UTC(romeParts.year, romeParts.month - 1, romeParts.day, romeParts.hour % 24, romeParts.minute);
  const offset = romeAsUtc - guess;
  const t = new Date(guess - offset + plusMinutes * 60000);
  return `${t.getUTCFullYear()}${pad(t.getUTCMonth() + 1)}${pad(t.getUTCDate())}T${pad(t.getUTCHours())}${pad(t.getUTCMinutes())}00Z`;
}

const esc = (s: string) => s.replace(/[\\,;]/g, m => `\\${m}`).replace(/\n/g, '\\n');

export function downloadIcs(opts: { code: string; title: string; date: string; time: string; minutes: number; location: string; description: string }) {
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Cavadduzzu//Prenotazioni//IT', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${opts.code}@prenotazioni`,
    `DTSTAMP:${romeToUtcStamp(new Date().toISOString().slice(0, 10), '00:00')}`,
    `DTSTART:${romeToUtcStamp(opts.date, opts.time)}`,
    `DTEND:${romeToUtcStamp(opts.date, opts.time, opts.minutes || 30)}`,
    `SUMMARY:${esc(opts.title)}`,
    `LOCATION:${esc(opts.location)}`,
    `DESCRIPTION:${esc(opts.description)}`,
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `appuntamento-${opts.code}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
