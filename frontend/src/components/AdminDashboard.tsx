import { useEffect, useState } from 'react';
import { TableSkeleton } from './ui';
import type { DashboardStats } from '../services/admin';
import { dashboardService } from '../services/admin';

/* ————— primitivas del dashboard ————— */

/** Cuenta hacia el número objetivo con缓 easing; respeta reduced-motion. */
function useCountUp(target: number, duration = 800): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(target);
      return;
    }
    let raf: number;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

function CountedNumber({ value, className }: { value: number; className?: string }) {
  const shown = useCountUp(value);
  return <span className={`tabular-nums ${className ?? ''}`}>{shown}</span>;
}

const dayLabel = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('es', { day: '2-digit', month: 'short' });

const todayLabel = () =>
  new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' });

function StatsCard({
  label,
  value,
  hint,
  delay,
}: {
  label: string;
  value: number;
  hint?: string;
  delay: number;
}) {
  return (
    <div
      className="rise group relative overflow-hidden rounded-3xl border border-cream-300/70 bg-gradient-to-br from-white/80 to-cream-100/50 p-6 shadow-soft transition-all duration-500 hover:-translate-y-1 hover:border-gold-400/60 hover:shadow-lifted"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* sello de esquina al hover */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-5 -top-5 h-14 w-14 rounded-full border border-gold-400/0 transition-all duration-500 group-hover:border-gold-400/50"
      />
      <p className="text-[11px] uppercase tracking-[0.25em] text-ink-400">{label}</p>
      <p className="mt-3 font-display text-5xl font-light text-ink-900">
        <CountedNumber value={value} />
      </p>
      <div className="mt-4 hairline-gold" />
      {hint && <p className="mt-2 text-xs text-ink-400">{hint}</p>}
    </div>
  );
}

/** Barra horizontal proporcional con llegada escalonada (CSS puro). */
function HBar({ label, value, max, delay }: { label: string; value: number; max: number; delay: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-36 shrink-0 truncate font-display italic text-ink-700">{label}</span>
      <span className="h-3 flex-1 overflow-hidden rounded-full bg-cream-200">
        <span
          className="block h-full rounded-full bg-gradient-to-r from-gold-400 to-clay-500"
          style={{ width: `${Math.max(pct, value > 0 ? 4 : 0)}%`, transition: 'width 0.9s cubic-bezier(.22,1,.36,1)', transitionDelay: `${delay}ms` }}
        />
      </span>
      <span className="w-8 text-right text-sm tabular-nums text-ink-500">{value}</span>
    </div>
  );
}

/* ————— vista principal ————— */

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService.stats()
      .then(setStats)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const maxDay = stats ? Math.max(...stats.visitsByDay.map((d) => d.count), 1) : 1;
  const maxSalon = stats ? Math.max(...stats.visitsBySalon.map((s) => s.count), 1) : 1;
  const canjeadas = stats?.rewardsByStatus.find((r) => r.status === 'CANJEADA')?.count ?? 0;
  const disponibles = stats?.rewardsByStatus.find((r) => r.status === 'DISPONIBLE')?.count ?? 0;

  return (
    <div className="mx-auto max-w-5xl">
      {/* ——— Cabecera editorial ——— */}
      <header className="rise mb-10 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-ink-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-clay-400/70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-clay-500" />
            </span>
            Panel de gratitud · {todayLabel()}
          </p>
          <h1 className="font-display text-5xl font-light leading-none text-ink-900 sm:text-6xl">
            Hoy en <em className="italic text-clay-600">Vitro</em>
          </h1>
          <p className="mt-4 hairline-gold max-w-xs" aria-hidden="true" />
        </div>
        {/* sello giratorio lento — firma del club */}
        <span
          aria-hidden="true"
          className="seal-spin hidden h-20 w-20 select-none items-center justify-center rounded-full border border-gold-400/50 font-display text-2xl text-gold-500 sm:flex"
        >
          ✦
        </span>
      </header>

      {loading && <TableSkeleton rows={4} />}

      {!loading && error && (
        <div role="alert" className="rounded-2xl bg-clay-500/10 px-4 py-3 text-sm text-clay-600">{error}</div>
      )}

      {!loading && !error && stats && (
        <>
          {/* ——— Cifras del club ——— */}
          <section aria-label="Cifras del club" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard label="Salones activos" value={stats.activeSalons} delay={0} />
            <StatsCard label="Clientes activos" value={stats.activeCustomers} delay={90} />
            <StatsCard label="Visitas válidas" value={stats.totalVisits} delay={180} />
            <StatsCard
              label="Visitas hoy"
              value={stats.visitsToday}
              hint={`Últimos 7 días: ${stats.visitsLast7}`}
              delay={270}
            />
          </section>

          {/* ——— Editorial de datos ——— */}
          <section className="mt-10 grid gap-6 lg:grid-cols-5">
            {/* Serie 14 días — tarjeta protagonista */}
            <div
              className="rise stripes-soft rounded-3xl border border-cream-300/70 bg-white/80 p-6 shadow-soft lg:col-span-3"
              style={{ animationDelay: '350ms' }}
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="font-display text-2xl font-light text-ink-900">
                  Pulso de <em className="italic text-clay-600">14 días</em>
                </h2>
                <span className="text-[10px] uppercase tracking-[0.25em] text-ink-400">Visitas válidas</span>
              </div>
              <div className="flex h-40 items-end gap-1.5">
                {stats.visitsByDay.map((d, i) => (
                  <div key={d.date} className="group relative flex-1">
                    <div
                      className="bar-grow w-full rounded-t-md bg-gradient-to-t from-clay-500/80 to-gold-400/90 transition-colors group-hover:from-clay-600 group-hover:to-gold-500"
                      style={{ height: `${Math.max((d.count / maxDay) * 100, d.count > 0 ? 8 : 2)}%`, animationDelay: `${420 + i * 45}ms` }}
                    />
                    <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink-900 px-2 py-0.5 text-[10px] text-cream-50 opacity-0 shadow-soft transition group-hover:opacity-100">
                      {dayLabel(d.date)} · {d.count}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex gap-1.5 text-[9px] text-ink-400">
                {stats.visitsByDay.map((d, i) => (
                  <span key={d.date} className="flex-1 text-center">{i % 2 === 0 ? d.date.slice(8) : ''}</span>
                ))}
              </div>
            </div>

            {/* Recompensas — duelo disponible/canjeadas */}
            <div
              className="rise relative overflow-hidden rounded-3xl border-t-4 border-gold-500 bg-gradient-to-b from-cream-200/70 to-cream-100 p-6 shadow-soft lg:col-span-2"
              style={{ animationDelay: '450ms' }}
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-10 -right-10 h-36 w-36 rounded-full border border-gold-400/40"
              />
              <h2 className="mb-6 font-display text-2xl font-light text-ink-900">Recompensas</h2>
              <div className="flex items-center justify-around">
                <div className="text-center">
                  <p className="font-display text-6xl font-light text-clay-600">
                    <CountedNumber value={disponibles} />
                  </p>
                  <p className="mt-2 text-[10px] uppercase tracking-[0.25em] text-ink-400">Disponibles</p>
                </div>
                <span aria-hidden="true" className="stamp-pop text-3xl text-gold-400" style={{ animationDelay: '700ms' }}>✦</span>
                <div className="text-center">
                  <p className="font-display text-6xl font-light text-ink-900">
                    <CountedNumber value={canjeadas} />
                  </p>
                  <p className="mt-2 text-[10px] uppercase tracking-[0.25em] text-ink-400">Canjeadas</p>
                </div>
              </div>
              <p className="mt-6 text-center font-display italic text-ink-400 text-sm">
                Cada ✦ es una recompensa entregada en persona
              </p>
            </div>

            {/* Por salón */}
            <div
              className="rise rounded-3xl border border-cream-300/70 bg-white/70 p-6 shadow-soft lg:col-span-5"
              style={{ animationDelay: '550ms' }}
            >
              <h2 className="mb-6 font-display text-2xl font-light text-ink-900">
                Peso de cada <em className="italic text-clay-600">salón</em>
              </h2>
              {stats.visitsBySalon.length === 0 ? (
                <p className="font-display italic text-ink-400">Aún no hay visitas registradas.</p>
              ) : (
                <div className="space-y-3.5">
                  {stats.visitsBySalon.map((s, i) => (
                    <HBar key={s.salonName} label={s.salonName} value={s.count} max={maxSalon} delay={300 + i * 120} />
                  ))}
                </div>
              )}
            </div>
          </section>

          <footer className="rise mt-8 flex items-center justify-between text-[10px] uppercase tracking-[0.25em] text-ink-400" style={{ animationDelay: '650ms' }}>
            <span>Data en vivo de tu club</span>
            <span aria-hidden="true" className="text-gold-400">✦ ✦ ✦</span>
            <span>Actualizado al momento</span>
          </footer>
        </>
      )}
    </div>
  );
}
