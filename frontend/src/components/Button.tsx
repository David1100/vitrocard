export const Button = ({
  variant = 'primary',
  loading = false,
  disabled = false,
  className = '',
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'gold' | 'ghost' | 'danger';
  loading?: boolean;
}) => {
  const base =
    'relative inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium uppercase tracking-[0.15em] transition duration-300 disabled:cursor-not-allowed disabled:opacity-70';
  const variants: Record<string, string> = {
    primary: 'bg-ink-900 text-cream-50 hover:shadow-lifted hover:-translate-y-px',
    gold: 'bg-gold-500 text-ink-900 hover:bg-gold-400 hover:shadow-lifted hover:-translate-y-px',
    ghost: 'border border-cream-300 bg-transparent text-ink-700 hover:bg-cream-100',
    danger: 'border border-clay-400/60 bg-transparent text-clay-600 hover:bg-clay-500/10',
  };
  return (
    <button
      className={`${base} ${variants[variant] ?? variants.primary} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      <span className={loading ? 'opacity-0' : 'inline-flex items-center gap-2'}>{children}</span>
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current" />
        </span>
      )}
    </button>
  );
};
