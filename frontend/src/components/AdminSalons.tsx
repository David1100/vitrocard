import { useCallback, useEffect, useState } from 'react';
import { Banner, ConfirmDialog, EmptyState, Field, Modal, StatusBadge, TableSkeleton } from './ui';
import { Button } from './Button';
import { QRModal } from './QRModal';
import type { PaginatedList, Salon, SalonInput } from '../services/admin';
import { salonsService } from '../services/admin';

type Feedback = { kind: 'success' | 'error'; message: string } | null;
type Handling = { kind: 'toggle'; salon: Salon } | { kind: 'qr'; salon: Salon } | null;

export default function AdminSalons() {
  const [search, setSearch] = useState('');
  const [list, setList] = useState<PaginatedList<Salon> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<SalonInput>({ name: '', address: '', phone: '', email: '' });
  const [formError, setFormError] = useState<string | null>(null);

  const [toToggle, setToToggle] = useState<Salon | null>(null);
  const [toggling, setToggling] = useState(false);
  const [qrSalon, setQrSalon] = useState<Salon | null>(null);

  const load = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      setList(await salonsService.list(query || undefined));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = () => load(search);

  // Carga inicial del listado al montar.
  useEffect(() => {
    void load('');
  }, [load]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    load(search);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (form.name.trim().length < 2) {
      setFormError('El nombre del salón es obligatorio.');
      return;
    }
    setCreating(true);
    setFormError(null);
    try {
      const { salon } = await salonsService.create({
        name: form.name.trim(),
        address: form.address?.trim() || undefined,
        phone: form.phone?.trim() || undefined,
        email: form.email?.trim() || undefined,
      });
      setCreateOpen(false);
      setForm({ name: '', address: '', phone: '', email: '' });
      setFeedback({ kind: 'success', message: `✓ Salón creado — código QR: ${salon.qrCode}` });
      refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo crear el salón');
    } finally {
      setCreating(false);
    }
  }

  async function confirmToggle() {
    if (!toToggle) return;
    setToggling(true);
    try {
      const next = toToggle.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await salonsService.setStatus(toToggle.id, next);
      setFeedback({
        kind: 'success',
        message: next === 'ACTIVE' ? '✓ Salón activado' : '✓ Salón desactivado',
      });
      setToToggle(null);
      refresh();
    } catch (err) {
      setFeedback({ kind: 'error', message: err instanceof Error ? err.message : 'No se pudo actualizar' });
    } finally {
      setToggling(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-light text-ink-900">
            <em className="italic text-clay-600">Salones</em> del grupo
          </h1>
          <p className="mt-1 text-sm text-ink-400">
            {list ? `${list.total} ${list.total === 1 ? 'salón' : 'salones'}` : '—'}
          </p>
        </div>
        <Button variant="gold" onClick={() => setCreateOpen(true)}>
          + Nuevo salón
        </Button>
      </header>

      {feedback && (
        <div className="mb-4">
          <Banner kind={feedback.kind} message={feedback.message} />
        </div>
      )}

      <form onSubmit={handleSearch} className="mb-5 flex gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar salón…"
          className="min-w-0 flex-1 rounded-xl border border-cream-300 bg-white/70 px-4 py-2.5 text-ink-900 outline-none transition placeholder:text-ink-400/60 focus:border-clay-400 focus:ring-2 focus:ring-clay-300/50"
        />
        <Button variant="ghost" type="submit">Buscar</Button>
      </form>

      {loading && <TableSkeleton />}

      {!loading && error && (
        <div className="mb-4">
          <Banner kind="error" message={error} />
        </div>
      )}

      {!loading && !error && list && list.items.length === 0 && (
        <EmptyState
          title="Aún no hay salones"
          hint="Crea el primer salón y genera su identificador QR seguro."
        />
      )}

      {!loading && !error && list && list.items.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {list.items.map((s) => (
            <article
              key={s.id}
              className="rounded-3xl border border-cream-300/70 bg-gradient-to-br from-white/80 to-cream-100/70 p-5 shadow-soft transition hover:shadow-lifted"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="font-display text-xl italic text-ink-900">{s.name}</h2>
                <StatusBadge status={s.status} />
              </div>
              <dl className="space-y-1.5 text-sm text-ink-500">
                {s.address && <div><dt className="sr-only">Dirección</dt><dd>📍 {s.address}</dd></div>}
                {s.phone && <div><dt className="sr-only">Teléfono</dt><dd>{s.phone}</dd></div>}
                {s.email && <div><dt className="sr-only">Email</dt><dd>{s.email}</dd></div>}
              </dl>
              <div className="mt-4 flex items-center justify-between border-t border-cream-300/60 pt-3">
                <button
                  type="button"
                  onClick={() => setQrSalon(s)}
                  className="text-xs uppercase tracking-wider text-clay-600 transition hover:text-ink-900"
                >
                  QR ↓
                </button>
                <button
                  type="button"
                  onClick={() => setToToggle(s)}
                  className="text-xs uppercase tracking-wider text-clay-600 transition hover:text-ink-900"
                >
                  {s.status === 'ACTIVE' ? 'Desactivar' : 'Activar'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal open={createOpen} title="Nuevo salón" onClose={() => setCreateOpen(false)}>
        <form onSubmit={handleCreate} className="space-y-4">
          <Field
            label="Nombre del salón"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            error={formError}
          />
          <Field
            label="Dirección (opcional)"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          <Field
            label="Teléfono (opcional)"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <Field
            label="Email (opcional)"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" type="button" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button variant="gold" type="submit" loading={creating}>Crear salón</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={toToggle !== null}
        title={toToggle?.status === 'ACTIVE' ? '¿Desactivar salón?' : '¿Activar salón?'}
        description="Un salón desactivado no acepta nuevas visitas hasta que vuelvas a activarlo."
        confirmLabel={toToggle?.status === 'ACTIVE' ? 'Desactivar' : 'Activar'}
        loading={toggling}
        onConfirm={confirmToggle}
        onCancel={() => setToToggle(null)}
      />

      <QRModal
        open={qrSalon !== null}
        salonName={qrSalon?.name ?? ''}
        qrCode={qrSalon?.qrCode ?? ''}
        onClose={() => setQrSalon(null)}
      />
    </div>
  );
}
