// Icone dei servizi (SVG in linea, nessuna dipendenza). Scelte per parola chiave del service_id.
const common = { width: 28, height: 28, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };

const Tyre = () => (
  <svg {...common}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" /><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" /></svg>
);
const Patch = () => (
  <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M9 9l6 6M15 9l-6 6" /></svg>
);
const Balance = () => (
  <svg {...common}><path d="M12 4v16M5 20h14M6 8l-3 6h6l-3-6zM18 8l-3 6h6l-3-6zM6 8h12" /></svg>
);
const Alignment = () => (
  <svg {...common}><rect x="4" y="3" width="4" height="7" rx="1" /><rect x="16" y="3" width="4" height="7" rx="1" /><rect x="4" y="14" width="4" height="7" rx="1" /><rect x="16" y="14" width="4" height="7" rx="1" /><path d="M8 6.5h8M8 17.5h8M12 6.5v11" /></svg>
);
const Swap = () => (
  <svg {...common}><path d="M7 4L3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7" /></svg>
);
const Gauge = () => (
  <svg {...common}><path d="M4 15a8 8 0 1 1 16 0" /><path d="M12 15l4-5" /><circle cx="12" cy="15" r="1.4" /></svg>
);
const Check = () => (
  <svg {...common}><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 3.5h6M9 12l2 2 4-4M9 17h6" /></svg>
);

export function ServiceIcon({ id }: { id: string }) {
  if (/revision/.test(id)) return <Check />;
  if (/foratur|ripar/.test(id)) return <Patch />;
  if (/equilibr/.test(id)) return <Balance />;
  if (/converg|assett/.test(id)) return <Alignment />;
  if (/invers/.test(id)) return <Swap />;
  if (/controll|tpms|pression/.test(id)) return <Gauge />;
  return <Tyre />;
}

export const PhoneIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />
  </svg>
);

export const PinIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 22s7-6.1 7-12a7 7 0 1 0-14 0c0 5.9 7 12 7 12z" /><circle cx="12" cy="10" r="2.5" />
  </svg>
);

export const CalendarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" />
  </svg>
);
