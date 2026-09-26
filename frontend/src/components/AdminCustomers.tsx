import { useCallback, useEffect, useMemo, useState } from 'react';
import { Banner, ConfirmDialog, EmptyState, Field, Modal, StatusBadge, TableSkeleton } from './ui';
import { Button } from './Button';
import type { Customer, CustomerInput, PaginatedList } from '../services/admin';
import { customersService } from '../services/admin';

type Feedback = { kind: 'success' | 'error'; message: string } | null;

/** Mensajes de dominio amigables; backend manda error crudo no se muestra. */
function friendlyError(fallback: string): string {
  return fallback;
}

export default function AdminCustomers() {
  const [search, setSearch] = useState('');
  const [list, setList] = useState<PaginatedList<Customer> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<CustomerInput>({ document: '', firstName: '', lastName: '', phone: '' });
  const [formError, setFormError] = useState<string | null>(null);

  const [toToggle, setToToggle] = useState<Customer | null>(null);
  const [toggling, setToggling] = useState(false);

  const load = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      setList(await customersService.list(query || undefined));
    } catch (err) {
      setError(err instanceof Error ? friendlyError(err.message) : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useMemo(() => () => load(search), [load, search]);

  // Carga inicial del listado al montar (sin esto, list queda en null y el skeleton es eterno).
  useEffect(() => {
    void load('');
  }, [load]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    load(search);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.document.trim() || !form.firstName.trim()) {
      setFormError('Documento y nombre son obligatorios.');
      return;
    }
    setCreating(true);
    setFormError(null);
    try {
      await customersService.create({
        document: form.document.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName?.trim() || undefined,
        phone: form.phone?.trim() || undefined,
      });
      setCreateOpen(false);
      setForm({ document: '', firstName: '', lastName: '', phone: '' });
      setFeedback({ kind: 'success', message: '✓ Cliente creado correctamente' });
      refresh();
    } catch (err) {
      setFormError(err instanceof Error ? friendlyError(err.message) : 'No se pudo crear el cliente');
    } finally {
      setCreating(false);
    }
  }

  async function confirmToggle() {
    if (!toToggle) return;
    setToggling(true);
    try {
      const next = toToggle.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await customersService.setStatus(toToggle.id, next);
      setFeedback({
        kind: 'success',
        message: next === 'ACTIVE' ? '✓ Cliente reactivado' : '✓ Cliente desactivado (sin eliminación física)',
      });
      setToToggle(null);
      refresh();
    } catch (err) {
      setFeedback({ kind: 'error', message: err instanceof Error ? friendlyError(err.message) : 'No se pudo actualizar' });
    } finally {
      setToggling(false);
    }
  }

  const firstName = (c: Customer) => `${c.firstName} ${c.lastName ?? ''}`.trim();

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-light text-ink-900">
            <em className="italic text-clay-600">Clientes</em> del club
          </h1>
          <p className="mt-1 text-sm text-ink-400">
            {list ? `${list.total} ${list.total === 1 ? 'cliente registrado' : 'clientes registrados'}` : '—'}
          </p>
        </div>
        <Button variant="gold" onClick={() => setCreateOpen(true)}>
          + Nuevo cliente
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
          placeholder="Buscar por documento o nombre…"
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
          title={search ? 'Sin coincidencias' : 'Aún no hay clientes'}
          hint={search ? 'Prueba con otro documento o nombre.' : 'Crea el primer cliente para empezar a sellar tarjetas.'}
        />
      )}

      {!loading && !error && list && list.items.length > 0 && (
        <div className="overflow-hidden rounded-3xl border border-cream-300/70 bg-white/70 shadow-soft">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-cream-300/70 text-[11px] uppercase tracking-[0.2em] text-ink-400">
                <th className="px-5 py-3.5">Cliente</th>
                <th className="px-5 py-3.5">Documento</th>
                <th className="px-5 py-3.5">Estado</th>
                <th className="px-5 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {list.items.map((c) => (
                <tr key={c.id} className="border-b border-cream-200/60 transition last:border-0 hover:bg-cream-100/60">
                  <td className="px-5 py-4">
                    <span className="font-display italic text-ink-900">{firstName(c)}</span>
                    {c.phone && <span className="block text-xs text-ink-400">{c.phone}</span>}
                  </td>
                  <td className="px-5 py-4 text-ink-500 tabular-nums">{c.document}</td>
                  <td className="px-5 py-4"><StatusBadge status={c.status} /></td>
                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => setToToggle(c)}
                      className="text-xs uppercase tracking-wider text-clay-600 transition hover:text-ink-900"
                    >
                      {c.status === 'ACTIVE' ? 'Desactivar' : 'Reactivar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: alta de cliente */}
      <Modal open={createOpen} title="Nuevo cliente" onClose={() => setCreateOpen(false)}>
        <form onSubmit={handleCreate} className="space-y-4">
          <Field
            label="Documento"
            inputMode="numeric"
            value={form.document}
            onChange={(e) => setForm({ ...form, document: e.target.value.replace(/\D/g, '') })}
            error={formError}
          />
          <Field
            label="Nombre"
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
          />
          <Field
            label="Apellido (opcional)"
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
          />
          <Field
            label="Teléfono (opcional)"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" type="button" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button variant="gold" type="submit" loading={creating}>Crear cliente</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={toToggle !== null}
        title={toToggle?.status === 'ACTIVE' ? '¿Desactivar cliente?' : '¿Reactivar cliente?'}
        description="Nunca se eliminan datos: la desactivación es reversible y conserva su historial."
        confirmLabel={toToggle?.status === 'ACTIVE' ? 'Desactivar' : 'Reactivar'}
        loading={toggling}
        onConfirm={confirmToggle}
        onCancel={() => setToToggle(null)}
      />
    </div>
  );
}
