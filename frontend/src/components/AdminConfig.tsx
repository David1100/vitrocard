import { useEffect, useState } from 'react';
import { Banner, TableSkeleton } from './ui';
import { Button } from './Button';
import { Field } from './ui';
import { loyaltyService } from '../services/admin';

type Feedback = { kind: 'success' | 'error'; message: string } | null;

export default function AdminConfig() {
  const [program, setProgram] = useState<{ name: string; requiredVisits: number } | null>(null);
  const [requiredVisits, setRequiredVisits] = useState('12');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loyaltyService
      .config()
      .then((p) => {
        setProgram(p);
        setRequiredVisits(String(p.requiredVisits));
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(requiredVisits);
    if (!Number.isInteger(n) || n < 1 || n > 100) {
      setFeedback({ kind: 'error', message: 'La regla debe ser un número entero entre 1 y 100.' });
      return;
    }
    setSaving(true);
    try {
      const res = await loyaltyService.update(n);
      setProgram(res.program);
      setFeedback({ kind: 'success', message: `✓ Regla actualizada: ${res.program.requiredVisits} visitas = 1 recompensa` });
    } catch (err) {
      setFeedback({ kind: 'error', message: err instanceof Error ? err.message : 'No se pudo actualizar' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-8">
        <h1 className="font-display text-4xl font-light text-ink-900">
          <em className="italic text-clay-600">Configuración</em> del programa
        </h1>
        <p className="mt-1 text-sm text-ink-400">La regla de fidelización nunca está fijada en el código.</p>
      </header>

      {feedback && (
        <div className="mb-4">
          <Banner kind={feedback.kind} message={feedback.message} />
        </div>
      )}

      {loading && <TableSkeleton rows={2} />}
      {!loading && error && <Banner kind="error" message={error} />}
      {!loading && !error && program && (
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-cream-300/70 bg-gradient-to-br from-white/80 to-cream-100/60 p-6 shadow-soft"
        >
          <p className="mb-5 font-display text-lg italic text-ink-900">{program.name}</p>
          <div className="flex items-end gap-4">
            <Field
              label="Visitas requeridas"
              type="number"
              min={1}
              max={100}
              value={requiredVisits}
              onChange={(e) => setRequiredVisits(e.target.value)}
              className="w-40"
            />
            <div className="flex-1 pb-3 text-sm text-ink-400">
              <span className="text-ink-900">{requiredVisits || '—'} visitas</span> = 1 recompensa
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Button variant="gold" type="submit" loading={saving}>
              Guardar regla
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
