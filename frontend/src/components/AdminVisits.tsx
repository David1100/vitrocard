import { useCallback, useEffect, useState } from 'react';
import { Banner, ConfirmDialog, EmptyState, Field, StatusBadge, TableSkeleton } from './ui';
import { Button } from './Button';
import type { PaginatedList, Salon, Visit } from '../services/admin';
import { salonsService, visitsService } from '../services/admin';

type Feedback = { kind: 'success' | 'error'; message: string } | null;

const time = (iso: string) =>
  new Date(iso).toLocaleString('es', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function AdminVisits() {
  // Formulario de registro rápido
  const [document, setDocument] = useState('');
  const [salons, setSalons] = useState<Salon[]>([]);
  const [salonId, setSalonId] = useState('');
  const [salonCheckError, setSalonCheckError] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);

  // Historial
  const [search, setSearch] = useState('');
  const [list, setList] = useState<PaginatedList<Visit> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toCancel, setToCancel] = useState<Visit | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const loadSalons = useCallback(async (preselectQr?: string) => {
    setSalonCheckError(null);
    try {
      const res = await salonsService.list();
      const active = res.items.filter((s) => s.status === 'ACTIVE');
      setSalons(active);
      // Preselección desde la landing del QR (/s/:code → ?salon=code)
      const match = preselectQr ? active.find((s) => s.qrCode === preselectQr) : undefined;
      setSalonId(match?.id ?? active[0]?.id ?? '');
      if (preselectQr && !match && active.length > 0) {
        setFeedback({ kind: 'error', message: 'El salón escaneado no está activo o no existe.' });
      }
    } catch (err) {
      setSalonCheckError(err instanceof Error ? err.message : 'No se pudieron cargar los salones');
    }
  }, []);

  const load = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      setList(await visitsService.list(query || undefined));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const preselect = new URLSearchParams(window.location.search).get('salon') ?? undefined;
    void loadSalons(preselect);
    void load('');
  }, [load, loadSalons]);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{6,12}$/.test(document)) {
      setFormError('Ingresa el documento del cliente (6–12 dígitos).');
      return;
    }
    if (!salonId) {
      setFormError('Selecciona un salón.');
      return;
    }
    setRegistering(true);
    setFormError(null);
    try {
      const result = await visitsService.create(document, salonId);
      const dots = `● ${result.totalVisits} de ${result.requiredVisits}`;
      setFeedback({
        kind: 'success',
        message: result.rewardGenerated
          ? `✓ Visita registrada — ¡recompensa generada! (${dots})`
          : `✓ Visita registrada — ${dots} en ${result.salonName}`,
      });
      setDocument('');
      load(search);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo registrar la visita');
    } finally {
      setRegistering(false);
    }
  }

  async function confirmCancel() {
    if (!toCancel) return;
    setCancelling(true);
    try {
      await visitsService.cancel(toCancel.id);
      setFeedback({ kind: 'success', message: '✓ Visita anulada (queda registrada quién lo hizo)' });
      setToCancel(null);
      load(search);
    } catch (err) {
      setFeedback({ kind: 'error', message: err instanceof Error ? err.message : 'No se pudo anular' });
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-8">
        <h1 className="font-display text-4xl font-light text-ink-900">
          <em className="italic text-clay-600">Visitas</em> del club
        </h1>
        <p className="mt-1 text-sm text-ink-400">Registra visitas y corrige errores anulando — nunca se eliminan.</p>
      </header>

      {/* Registro rápido */}
      <form
        onSubmit={handleRegister}
        noValidate
        className="mb-10 rounded-3xl border border-cream-300/70 bg-gradient-to-br from-white/80 to-cream-100/60 p-6 shadow-soft"
      >
        <h2 className="mb-4 font-display text-xl italic text-ink-900">Registrar visita</h2>
        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <Field
            label="Documento del cliente"
            inputMode="numeric"
            value={document}
            onChange={(e) => setDocument(e.target.value.replace(/\D/g, ''))}
            placeholder="Ej. 1032764412"
            error={formError}
          />
          <label className="block">
            <span className="mb-1.5 block text-xs uppercase tracking-[0.25em] text-ink-400">Salón</span>
            <select
              value={salonId}
              onChange={(e) => setSalonId(e.target.value)}
              className="w-full rounded-xl border border-cream-300 bg-cream-50 px-4 py-3 text-ink-900 outline-none transition focus:border-clay-400 focus:ring-2 focus:ring-clay-300/50"
            >
              {salons.length === 0 && <option value="">— sin salones activos —</option>}
              {salons.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        {salonCheckError && (
          <p role="alert" className="mt-3 text-sm text-clay-600">
            {salonCheckError}
          </p>
        )}
        <div className="mt-5 flex justify-end">
          <Button variant="gold" type="submit" loading={registering}>
            Registrar visita
          </Button>
        </div>
      </form>

      {feedback && (
        <div className="mb-4">
          <Banner kind={feedback.kind} message={feedback.message} />
        </div>
      )}

      <h2 className="mb-4 font-display text-2xl italic text-ink-900">Historial</h2>
      <form onSubmit={(e) => { e.preventDefault(); load(search); }} className="mb-5 flex gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por cliente, documento o salón…"
          className="min-w-0 flex-1 rounded-xl border border-cream-300 bg-white/70 px-4 py-2.5 text-ink-900 outline-none transition placeholder:text-ink-400/60 focus:border-clay-400 focus:ring-2 focus:ring-clay-300/50"
        />
        <Button variant="ghost" type="submit">Buscar</Button>
      </form>
    <div className="mt-6">
      {loading && <TableSkeleton />}
      {!loading && error && <Banner kind="error" message={error} />}
      {!loading && !error && list && list.items.length === 0 && (
        <EmptyState title="Sin visitas" hint="Registra la primera visita arriba." />
      )}
      {!loading && !error && list && list.items.length > 0 && (
        <div className="overflow-hidden rounded-3xl border border-cream-300/70 bg-white/70 shadow-soft">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-cream-300/70 text-[11px] uppercase tracking-[0.2em] text-ink-400">
                <th className="px-5 py-3.5">Cliente</th>
                <th className="px-5 py-3.5">Salón</th>
                <th className="px-5 py-3.5">Fecha</th>
                <th className="px-5 py-3.5">Estado</th>
                <th className="px-5 py-3.5 text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {list.items.map((v) => (
                <tr key={v.id} className="border-b border-cream-200/60 transition last:border-0 hover:bg-cream-100/60">
                  <td className="px-5 py-4">
                    <span className="font-display italic text-ink-900">
                      {v.customer.firstName} {v.customer.lastName ?? ''}
                    </span>
                    <span className="block text-xs text-ink-400 tabular-nums">{v.customer.document}</span>
                  </td>
                  <td className="px-5 py-4 text-ink-500">{v.salon.name}</td>
                  <td className="px-5 py-4 text-ink-500">{time(v.createdAt)}</td>
                  <td className="px-5 py-4">
                    <StatusBadge status={v.status} />
                    {v.cancelledBy && <span className="block text-xs text-ink-400">por {v.cancelledBy}</span>}
                  </td>
                  <td className="px-5 py-4 text-right">
                    {v.status === 'VALIDA' ? (
                      <button
                        type="button"
                        onClick={() => setToCancel(v)}
                        className="text-xs uppercase tracking-wider text-clay-600 transition hover:text-ink-900"
                      >
                        Anular
                      </button>
                    ) : (
                      <span className="text-xs text-ink-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>

      <ConfirmDialog
        open={toCancel !== null}
        title="¿Anular esta visita?"
        description="La visita quedará como ANULADA con registro de quién la anuló. Su historial no se pierde."
        confirmLabel="Anular visita"
        loading={cancelling}
        onConfirm={confirmCancel}
        onCancel={() => setToCancel(null)}
      />
    </div>
  );
}
