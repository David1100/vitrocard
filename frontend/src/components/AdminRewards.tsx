import { useCallback, useEffect, useState } from 'react';
import { Banner, EmptyState, Field, Modal } from './ui';
import { Button } from './Button';
import type { CustomerRewardsLookup } from '../services/admin';
import { rewardsService, salonsService, type Salon } from '../services/admin';

type Feedback = { kind: 'success' | 'error'; message: string } | null;

export default function AdminRewards() {
  const [document, setDocument] = useState('');
  const [lookup, setLookup] = useState<CustomerRewardsLookup | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [searching, setSearching] = useState(false);

  // Canje
  const [salons, setSalons] = useState<Salon[]>([]);
  const [salonError, setSalonError] = useState<string | null>(null);
  const [redeemTarget, setRedeemTarget] = useState<{ id: string; name: string } | null>(null);
  const [salonId, setSalonId] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [redeemError, setRedeemError] = useState<string | null>(null);

  useEffect(() => {
    salonsService
      .list()
      .then((res) => {
        const active = res.items.filter((s) => s.status === 'ACTIVE');
        setSalons(active);
        setSalonId(active[0]?.id ?? '');
      })
      .catch((err: Error) => setSalonError(err.message));
  }, []);

  const search = useCallback(async (doc: string) => {
    setSearching(true);
    setError(null);
    setLookup(null);
    try {
      setLookup(await rewardsService.byDocument(doc));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo consultar');
    } finally {
      setSearching(false);
    }
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{6,12}$/.test(document)) {
      setError('Ingresa el documento del cliente (6–12 dígitos).');
      return;
    }
    search(document);
  }

  async function confirmRedeem() {
    if (!redeemTarget || !salonId) return;
    setRedeeming(true);
    setRedeemError(null);
    try {
      const result = await rewardsService.redeem(redeemTarget.id, salonId);
      setRedeemTarget(null);
      setFeedback({
        kind: 'success',
        message: `✓ "¡Recompensa canjeada!" — ${result.rewardName} para ${result.customerName} en ${result.salonName}`,
      });
      // Recarga el listado: si era la última, muestra vacío/404.
      void search(document);
    } catch (err) {
      setRedeemError(err instanceof Error ? err.message : 'No se pudo canjear');
    } finally {
      setRedeeming(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-8">
        <h1 className="font-display text-4xl font-light text-ink-900">
          <em className="italic text-clay-600">Recompensas</em> a canjear
        </h1>
        <p className="mt-1 text-sm text-ink-400">El cliente muestra su tarjeta; tú validas el premio aquí.</p>
      </header>

      {feedback && (
        <div className="mb-4">
          <Banner kind={feedback.kind} message={feedback.message} />
        </div>
      )}

      <form onSubmit={handleSearch} noValidate className="mb-6 rounded-3xl border border-cream-300/70 bg-gradient-to-br from-white/80 to-cream-100/60 p-6 shadow-soft">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Field
            label="Documento del cliente"
            inputMode="numeric"
            value={document}
            onChange={(e) => setDocument(e.target.value.replace(/\D/g, ''))}
            placeholder="Ej. 1032764412"
            className="flex-1"
          />
          <Button variant="gold" type="submit" loading={searching} className="shrink-0">
            Buscar recompensas
          </Button>
        </div>
          {salonError && <p role="alert" className="mt-3 text-sm text-clay-600">{salonError}</p>}
      </form>

      {searching && (
        <p className="py-8 text-center font-display italic text-ink-400">Buscando recompensas…</p>
      )}

      {!searching && error && (
        <EmptyState title={error} hint="¿Terminaste las visitas del programa en un salón activo?" />
      )}

      {!searching && !error && lookup && (
        <section>
          <p className="mb-4 font-display text-xl italic text-ink-900">
            {lookup.customer.firstName} {lookup.customer.lastName ?? ''} tiene <span className="text-clay-600">{lookup.rewards.length === 1 ? '1 recompensa pendiente' : `${lookup.rewards.length} recompensas pendientes`}</span>
          </p>
          <div className="space-y-4">
            {lookup.rewards.map((r) => (
              <article
                key={r.id}
                className="relative overflow-hidden rounded-3xl border border-gold-400/50 bg-gradient-to-br from-cream-100 to-cream-200/70 p-6 shadow-soft"
              >
                <div aria-hidden="true" className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full border border-gold-400/40" />
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-2xl italic text-ink-900">
                      <span aria-hidden="true" className="mr-2 text-gold-500">✦</span>
                      {r.rewardName}
                    </h3>
                    {r.rewardDescription && <p className="mt-1 text-sm text-ink-500">{r.rewardDescription}</p>}
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-ink-400">
                      Obtenida por {r.requiredVisits} visitas · ganada en {r.salonName} ·{' '}
                      {new Date(r.earnedAt).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <Button variant="primary" onClick={() => setRedeemTarget({ id: r.id, name: r.rewardName })}>
                    Canjear
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Modal de canje: elegir salón donde ocurre */}
      <Modal open={redeemTarget !== null} title="Canjear recompensa" onClose={() => setRedeemTarget(null)}>
        <p className="mb-4 text-sm text-ink-500">
          Registra el canje de <strong className="text-ink-900">{redeemTarget?.name}</strong>. La acción pasa la
          recompensa a <em>CANJEADA</em> y no podrá repetirse.
        </p>
        <label className="block">
          <span className="mb-1.5 block text-xs uppercase tracking-[0.25em] text-ink-400">Salón del canje</span>
          <select
            value={salonId}
            onChange={(e) => setSalonId(e.target.value)}
            className="w-full rounded-xl border border-cream-300 bg-cream-50 px-4 py-3 text-ink-900 outline-none transition focus:border-clay-400 focus:ring-2 focus:ring-clay-300/50"
          >
            {salons.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </label>
        {redeemError && (
          <p role="alert" className="mt-3 text-sm text-clay-600">{redeemError}</p>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setRedeemTarget(null)}>Cancelar</Button>
          <Button variant="gold" loading={redeeming} onClick={confirmRedeem}>Confirmar canje</Button>
        </div>
      </Modal>
    </div>
  );
}
