import { useEffect, useState } from 'react';
import { navigate } from 'astro:transitions/client';
import { api, apiBaseUrl, setAccessToken } from '../services/api';
import { adminLogout, adminMe, type AdminUser } from '../services/auth';
import AdminDashboard from './AdminDashboard';
import AdminCustomers from './AdminCustomers';
import AdminSalons from './AdminSalons';
import AdminVisits from './AdminVisits';
import AdminRewards from './AdminRewards';
import AdminConfig from './AdminConfig';

export type AdminPage =
  | 'dashboard'
  | 'clientes'
  | 'salones'
  | 'visitas'
  | 'recompensas'
  | 'configuracion';

const VIEWS: Record<AdminPage, React.ComponentType> = {
  dashboard: AdminDashboard,
  clientes: AdminCustomers,
  salones: AdminSalons,
  visitas: AdminVisits,
  recompensas: AdminRewards,
  configuracion: AdminConfig,
};

function defaultRedirect(): void {
  navigate('/admin/login');
}

/**
 * App admin real (SPSPA-like): UNA sola island hidratada por página.
 * Las vistas son componentes React reales (no slots server-side), por lo que
 * sus useEffect/protecciones de sesión sí se ejecutan.
 */
export default function AdminApp({ page }: { page: AdminPage }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [state, setState] = useState<'checking' | 'auth' | 'redirect'>('checking');
  const [showOffline, setShowOffline] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      // restaurar sesión con la cookie HttpOnly
      try {
        const res = await fetch(`${apiBaseUrl()}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });
        if (alive && res.ok) {
          const data = (await res.json()) as { accessToken?: string };
          setAccessToken(data.accessToken ?? null);
        }
      } catch {
        setAccessToken(null);
        setShowOffline(true);
      }
      try {
        const me = await adminMe();
        if (!alive) return;
        setUser(me);
        setState('auth');
      } catch {
        if (alive) defaultRedirect();
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (state === 'checking') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="font-display text-lg italic text-ink-400">Abriendo el panel…</p>
      </div>
    );
  }

  const View = VIEWS[page];

  return (
    <div>
      {showOffline && (
        <div role="alert" className="mb-4 rounded-2xl bg-clay-500/15 px-4 py-3 text-sm text-ink-900">
          El backend no responde — ejecuta <code className="rounded bg-cream-200 px-1.5">cd backend &amp;&amp; npm run dev</code> y recarga.
        </div>
      )}
      {user && (
        <div className="mb-6 flex items-center justify-end gap-3 text-xs uppercase tracking-[0.2em] text-ink-400">
          <span className="text-ink-500">{user.name}</span>
          <button
            type="button"
            onClick={() => adminLogout().then(defaultRedirect)}
            className="rounded-full border border-cream-300 px-3 py-1 transition hover:bg-cream-100"
          >
            Salir
          </button>
        </div>
      )}
      <View />
    </div>
  );
}
