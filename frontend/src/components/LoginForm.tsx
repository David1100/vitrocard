import { useState } from 'react';
import { navigate } from 'astro:transitions/client';
import { adminLogin } from '../services/auth';
import { Button } from './Button';
import { Field } from './ui';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);
    adminLogin(email.trim(), password)
      .then(() => navigate('/admin/clientes'))
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <Field
        label="Usuario"
        type="email"
        name="email"
        autoComplete="username"
        placeholder="tu@salon.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={error}
      />
      <Field
        label="Contraseña"
        type="password"
        name="password"
        autoComplete="current-password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Button type="submit" variant="gold" className="w-full !rounded-xl" loading={loading}>
        Iniciar sesión
      </Button>
      <p className="pt-1 text-center text-[11px] uppercase tracking-[0.25em] text-ink-400">
        Acceso exclusivo del equipo Vitro
      </p>
    </form>
  );
}
