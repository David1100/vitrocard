import { useEffect, useState } from 'react';

export interface LoyaltyCardProps {
  visits: number;
  required: number;
  salonName?: string;
}

/** Mensajes de dominio visibles al usuario, en español. */
function remainingMessage(visits: number, required: number): string {
  const missing = required - visits;
  if (missing <= 0) return '¡Tienes una recompensa disponible!';
  return `Te faltan ${missing} ${missing === 1 ? 'visita' : 'visitas'} para tu recompensa.`;
}

export default function LoyaltyCard({ visits, required, salonName }: LoyaltyCardProps) {
  const filled = Math.min(visits, required);
  const complete = filled >= required;
  const [animateUpTo, setAnimateUpTo] = useState(0);
  const [canTilt, setCanTilt] = useState(false);
  const [tilt, setTilt] = useState<[number, number]>([0, 0]);
  const [glare, setGlare] = useState({ x: 50, y: 40 });

  // Escalonado de sellos: aparecen uno a uno al montar/actualizar.
  useEffect(() => {
    setAnimateUpTo(0);
    if (filled === 0) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i <= filled; i++) {
      timers.push(setTimeout(() => setAnimateUpTo(i), 120 * i + 250));
    }
    return () => timers.forEach(clearTimeout);
  }, [filled]);

  // Tilt 3D solo si el dispositivo no pide movimiento reducido.
  useEffect(() => {
    setCanTilt(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  function handleMove(e: React.PointerEvent<HTMLElement>) {
    if (!canTilt) return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    setTilt([(0.5 - py) * 9, (px - 0.5) * 11]);
    setGlare({ x: px * 100, y: py * 100 });
  }

  const [rx, ry] = tilt;
  const hovering = rx !== 0 || ry !== 0;

  return (
    <article
      className="relative overflow-hidden rounded-3xl border border-cream-300/70 bg-gradient-to-br from-cream-100 via-cream-50 to-cream-200 p-6 shadow-lifted transition-transform duration-200 ease-out sm:p-8"
      style={{ transform: hovering ? `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)` : 'perspective(900px)' }}
      onPointerMove={handleMove}
      onPointerLeave={() => setTilt([0, 0])}
      aria-live="polite"
    >
      {/* Destello especular que sigue el cursor */}
      {canTilt && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-3xl"
          style={{
            background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgb(255 255 255 / 0.35), transparent 55%)`,
            opacity: hovering ? 1 : 0,
            transition: 'opacity 0.4s ease-out',
          }}
        />
      )}

      {/* Chispas doradas al completar la tarjeta */}
      {complete &&
        [
          { top: '8%', left: '8%', d: 0 },
          { top: '14%', left: '88%', d: 0.45 },
          { top: '38%', left: '94%', d: 0.9 },
          { top: '58%', left: '4%', d: 1.3 },
          { top: '82%', left: '78%', d: 1.75 },
          { top: '90%', left: '30%', d: 2.2 },
        ].map((s, i) => (
          <span
            key={i}
            aria-hidden="true"
            className="spark pointer-events-none absolute text-lg text-gold-500"
            style={{ top: s.top, left: s.left, animationDelay: `${s.d}s` }}
          >
            ✦
          </span>
        ))}

      {/* Decoración: arco orbital superpuesto */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full border border-gold-400/40"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full border border-clay-300/50"
      />

      <header className="relative mb-2 flex items-center justify-between">        <span className="font-display text-xs uppercase tracking-[0.35em] text-ink-400">Tarjeta Vitro</span>
        {salonName && <span className="text-[11px] uppercase tracking-widest text-ink-400">{salonName}</span>}
      </header>

      <p className={`font-display text-5xl font-light leading-none text-ink-900 sm:text-6xl ${complete ? 'glow-gold' : ''}`}>
        {visits}
        <span className="mx-1 align-[0.35em] text-3xl font-light italic text-clay-500">de</span>
        {required}
      </p>

      {/* Sellos */}
      <div className="mt-6 grid grid-cols-6 gap-x-2 gap-y-3 sm:grid-cols-12" role="img" aria-label={`${visits} de ${required} sellos`}>
        {Array.from({ length: required }, (_, i) => {
          const earned = i < animateUpTo;
          const isNext = i === filled && !complete;
          return (
            <span key={i} className="relative flex items-center justify-center">
              <span
                className={[
                  'h-6 w-6 rounded-full border-2 transition-colors duration-500 sm:h-7 sm:w-7',
                  earned
                    ? 'border-clay-500 bg-gradient-to-br from-gold-400 to-clay-500'
                    : 'border-dashed border-ink-400/40 bg-transparent',
                ].join(' ')}
                style={earned ? { animation: 'pop 0.45s cubic-bezier(0.34,1.56,0.64,1) both' } : undefined}
              />
              {isNext && (
                <span
                  aria-hidden="true"
                  className="absolute inset-0 animate-ping rounded-full bg-clay-300/40"
                />
              )}
            </span>
          );
        })}
      </div>

      <footer className="mt-6 flex items-end justify-between border-t border-cream-300/60 pt-4">
        <p className={complete ? 'text-clay-600' : 'text-ink-500'}>
          <span className="font-display italic">{remainingMessage(visits, required)}</span>
        </p>
      </footer>
    </article>
  );
}
