import { useState } from 'react';
import LoyaltyCard from './LoyaltyCard';
import type { LookupState } from '../services/loyalty';
import { lookupByDocument, validateDocument } from '../services/loyalty';

export default function ConsultaForm() {
  const [document, setDocument] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<LookupState>({ status: 'idle' });

  const loading = state.status === 'loading';

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const invalid = validateDocument(document);
    setError(invalid);
    if (invalid || loading) return;

    setState({ status: 'loading' });
    lookupByDocument(document)
      .then((result) => setState({ status: 'success', result }))
      .catch((err: Error) => setState({ status: 'error', message: err.message }));
  }

  return (
    <div className="w-full max-w-xl">
      <form
        onSubmit={handleSubmit}
        noValidate
        className="breathe rounded-3xl border border-cream-300/70 bg-white/70 p-5 shadow-soft backdrop-blur-sm sm:p-6"
      >
        <label htmlFor="doc" className="mb-2 block text-sm uppercase tracking-[0.2em] text-ink-500">
          Tu número de documento
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id="doc"
            name="doc"
            inputMode="numeric"
            autoComplete="off"
            placeholder="Ej. 1032764412"
            value={document}
            onChange={(e) => {
              setDocument(e.target.value.replace(/\D/g, ''));
              if (error) setError(null);
            }}
            disabled={loading}
            className="min-w-0 flex-1 rounded-2xl border border-cream-300 bg-cream-50 px-5 py-3.5 text-lg text-ink-900 placeholder-ink-400/60 outline-none transition focus:border-clay-400 focus:ring-2 focus:ring-clay-300/50 disabled:opacity-60"
            aria-invalid={!!error}
          />
          <button
            type="submit"
            disabled={loading}
            className="sheen group relative overflow-hidden rounded-2xl bg-ink-900 px-7 py-3.5 text-sm font-medium uppercase tracking-[0.2em] text-cream-50 shadow-soft transition hover:-translate-y-px hover:shadow-lifted active:translate-y-0 disabled:cursor-wait disabled:opacity-80"
          >
            <span className={['transition-opacity', loading ? 'opacity-0' : ''].join(' ')}>Consultar</span>
            {loading && (
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-cream-50/30 border-t-cream-50" />
              </span>
            )}
          </button>
        </div>
        {error && (
          <p role="alert" key={error} className="shake mt-3 text-sm text-clay-600">
            {error}
          </p>
        )}
      </form>

      {/* Resultado / estados */}
      <div className="mt-8" aria-live="polite">
        {state.status === 'loading' && (
          <div className="relative overflow-hidden rounded-3xl border border-cream-300/70 bg-white/60 p-8 shadow-soft">
            <div className="h-4 w-24 animate-pulse rounded-full bg-cream-300" />
            <div className="mt-4 h-12 w-40 animate-pulse rounded-2xl bg-cream-300" />
            <div className="mt-8 grid grid-cols-6 gap-3">
              {Array.from({ length: 12 }, (_, i) => (
                <div key={i} className="h-7 w-7 animate-pulse rounded-full bg-cream-200" />
              ))}
            </div>
          </div>
        )}

        {state.status === 'success' && (
          <div className="stamp-pop">
            {state.result.visits > 0 || state.result.rewardsAvailable > 0 ? (
              <>
                {state.result.name && (
                  <p className="rise mb-3 font-display text-2xl italic text-ink-700">
                    Hola, {state.result.name.split(' ')[0]} 👋
                  </p>
                )}
                <LoyaltyCard
                  visits={state.result.visits}
                  required={state.result.requiredVisits}
                  salonName={state.result.salonName}
                />
                {state.result.rewardsAvailable > 0 && (
                  <p className="rise sheen sheen-soft mt-4 rounded-2xl border border-gold-400/50 bg-gold-400/10 px-5 py-4 font-display text-lg text-ink-900">
                    <span aria-hidden="true" className="twinkle mr-1.5 text-gold-500">✦</span>
                    Golden moment ✦ Tienes {state.result.rewardsAvailable === 1 ? 'una recompensa pendiente' : `${state.result.rewardsAvailable} recompensas pendientes`} — la canjeas en tu próximo salón.
                  </p>
                )}
              </>
            ) : (
              <p className="rounded-3xl border border-cream-300/70 bg-white/60 px-6 py-8 text-center font-display italic text-ink-500 shadow-soft">
                Aún no tienes sellos en tu tarjeta. ¡En tu próxima visita empezará a llenarse! ✦
              </p>
            )}
          </div>
        )}

        {state.status === 'error' && (
          <p
            role="alert"
            className="rounded-3xl border border-cream-300/70 bg-white/60 px-6 py-8 text-center font-display italic text-ink-500 shadow-soft"
          >
            {state.message}
          </p>
        )}
      </div>
    </div>
  );
}
