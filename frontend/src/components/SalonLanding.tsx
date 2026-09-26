import { useEffect, useState } from 'react';
import { salonsService } from '../services/admin';

type State =
  | { status: 'loading' }
  | { status: 'ok'; salonName: string }
  | { status: 'error'; message: string };

/**
 * Landing pública del QR del salón: solo muestra el nombre (lectura,
 * nada sensible) y enlaza al registro del panel con el salón preseleccionado.
 */
export default function SalonLanding({ code }: { code: string }) {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    let alive = true;
    salonsService
      .byQrCode(code)
      .then((res) => {
        if (alive) setState({ status: 'ok', salonName: res.name });
      })
      .catch((err: Error) => {
        if (alive) setState({ status: 'error', message: err.message });
      });
    return () => {
      alive = false;
    };
  }, [code]);

  if (state.status === 'loading') {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-cream-300 border-t-clay-500" />
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <p className="rounded-3xl border border-cream-300/70 bg-white/60 px-6 py-10 text-center font-display italic text-ink-500 shadow-soft">
        {state.message}
      </p>
    );
  }

  return (
    <div className="text-center">
      <p className="text-[11px] uppercase tracking-[0.3em] text-gold-400">Bienvenido a</p>
      <h1 className="font-display text-5xl font-light italic text-ink-900 sm:text-6xl">{state.salonName}</h1>
      <p className="mx-auto mt-4 max-w-sm text-ink-500">
        Aquí tu equipo registra tus visitas de tu tarjeta Vitro. Puedes consultar tu progreso cuando quieras.
      </p>
      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <a
          href={`/admin/visitas?salon=${encodeURIComponent(code)}`}
          className="rounded-2xl bg-ink-900 px-7 py-3.5 text-sm font-medium uppercase tracking-[0.2em] text-cream-50 shadow-soft transition hover:shadow-lifted"
        >
          Registrar visita ↗
        </a>
        <a
          href="/consulta"
          className="rounded-2xl border border-cream-300 bg-white/70 px-7 py-3.5 text-sm font-medium uppercase tracking-[0.2em] text-ink-700 transition hover:bg-cream-100"
        >
          Consultar mi tarjeta
        </a>
      </div>
    </div>
  );
}
