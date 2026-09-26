import { Button } from './Button';

export const Field = ({
  label,
  error,
  className = '',
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string | null }) => (
  <label className={`block ${className}`}>
    <span className="mb-1.5 block text-xs uppercase tracking-[0.25em] text-ink-400">{label}</span>
    <input
      className={`w-full rounded-xl border bg-cream-50 px-4 py-3 text-ink-900 outline-none transition placeholder:text-ink-400/60 focus:ring-2 ${
        error
          ? 'border-clay-400 focus:border-clay-500 focus:ring-clay-300/50'
          : 'border-cream-300 focus:border-clay-400 focus:ring-clay-300/50'
      }`}
      aria-invalid={!!error}
      {...props}
    />
    {error && <span role="alert" className="mt-1.5 block text-xs text-clay-600">{error}</span>}
  </label>
);

export interface BannerProps {
  kind: 'success' | 'error';
  message: string;
}

/** Feedback de acción con máximo contraste (verde denominado/clay según estado). */
export function Banner({ kind, message }: BannerProps) {
  const tones = {
    success: 'border border-clay-300/70 bg-clay-500/10 text-clay-600',
    error: 'border border-clay-400 bg-clay-500/15 text-ink-900',
  } as const;
  return (
    <div role="status" className={`rounded-2xl px-4 py-3 text-sm font-medium ${tones[kind]}`}>
      {kind === 'success' ? '✓ ' : '✕ '}
      {message}
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-cream-300 bg-white/50 px-8 py-14 text-center">
      <span aria-hidden="true" className="mb-3 text-2xl text-gold-400">✦</span>
      <p className="font-display text-lg italic text-ink-700">{title}</p>
      {hint && <p className="mt-2 text-sm text-ink-400">{hint}</p>}
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-3xl border border-cream-300/70 bg-white/60 px-6 py-8">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="mb-4 flex items-center gap-4 last:mb-0">
          <div className="h-9 animate-pulse rounded-xl bg-cream-200" style={{ width: `${55 + (i % 3) * 15}%` }} />
          <div className="h-6 w-20 animate-pulse rounded-lg bg-cream-200" />
        </div>
      ))}
    </div>
  );
}

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog = ({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-ink-900/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={onCancel}
    >
      <div
        className="stamp-pop w-full max-w-sm rounded-3xl border border-cream-300 bg-cream-50 p-6 shadow-lifted"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-xl italic text-ink-900">{title}</h3>
        {description && <p className="mt-2 text-sm leading-relaxed text-ink-500">{description}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant="primary" loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};

export interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export const Modal = ({ open, title, onClose, children }: ModalProps) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-ink-900/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="rise w-full max-w-md rounded-3xl border border-cream-300 bg-cream-50 p-7 shadow-lifted"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between">
          <h3 className="font-display text-2xl italic text-ink-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-full border border-cream-300 px-2.5 py-0.5 text-ink-400 transition hover:bg-cream-100 hover:text-ink-900"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export const StatusBadge = ({ status }: { status: string }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${
      status === 'ACTIVE' || status === 'VALIDA'
        ? 'bg-clay-500/15 text-clay-600'
        : 'bg-ink-400/10 text-ink-400'
    }`}
  >
    <span className="h-1.5 w-1.5 rounded-full bg-current" />
    {status === 'ACTIVE' ? 'Activo' : status === 'INACTIVE' ? 'Inactivo' : status === 'VALIDA' ? 'Válida' : 'Anulada'}
  </span>
);
