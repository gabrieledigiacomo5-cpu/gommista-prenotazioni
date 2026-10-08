// Fascia decorativa del carretto: quando entra nello schermo una gomma la percorre rotolando e lascia la traccia del battistrada.
// Solo CSS transform guidati dallo scroll (nessun WebGL). Con "riduci animazioni" la gomma resta ferma a sinistra.
import { useEffect, useRef } from 'react';
import { reducedMotion } from './motion';

export default function RollingBand() {
  const band = useRef<HTMLDivElement>(null);
  const wheel = useRef<HTMLImageElement>(null);
  const trail = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = band.current;
    if (!el || reducedMotion()) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 quando la fascia entra dal basso, 1 quando arriva a un terzo dello schermo
      const t = Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.7)));
      const size = wheel.current?.offsetWidth || 56;
      const x = t * (r.width - size);
      if (wheel.current) wheel.current.style.transform = `translateX(${x}px) rotate(${(x / (size / 2)) * (180 / Math.PI)}deg)`;
      if (trail.current) trail.current.style.width = `${x + size / 2}px`;
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="band" ref={band} aria-hidden="true">
      <div className="band-road">
        <div className="band-trail" ref={trail} />
        <img className="band-wheel" ref={wheel} src="./ruota.svg" alt="" width="56" height="56" />
      </div>
      <div className="band-pattern" />
    </div>
  );
}
