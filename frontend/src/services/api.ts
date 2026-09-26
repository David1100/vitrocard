/**
 * Base de la API. Si no se configura PUBLIC_API_URL, se deriva del hostname
 * con el que el usuario navega: evita el mismatch localhost↔127.0.0.1 que
 * hace que el navegador retenga la cookie HttpOnly (SameSite).
 */
export function apiBaseUrl(): string {
  const configured = import.meta.env.PUBLIC_API_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:3000/api`;
  }
  return 'http://localhost:3000/api';
}

const API_BASE = apiBaseUrl();

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export interface ApiRequestInit {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
}

async function rawFetch(path: string, init: ApiRequestInit = {}): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: init.method ?? 'GET',
      headers: {
        ...(init.body !== undefined && { 'Content-Type': 'application/json' }),
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      credentials: 'include',
    });
  } catch {
    // error de red/DNS/conexión negada — mensaje amigable, sin detalles técnicos
    throw new ApiError(0, 'No pudimos conectar con el servidor. ¿Está corriendo el backend?');
  }
  return res;
}

/** Refresca la sesión usando la cookie; devuelve el access token o null. */
async function refreshSession(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { accessToken?: string };
    accessToken = data.accessToken ?? null;
    return accessToken !== null;
  } catch {
    return false;
  }
}

/** Peticiones autenticadas con reintento único ante 401. */
export async function api<T>(path: string, init: ApiRequestInit = {}, retried = false): Promise<T> {
  const res = await rawFetch(path, init);

  if (res.status === 401 && !retried && accessToken !== null) {
    const ok = await refreshSession();
    if (ok) return api<T>(path, init, true);
    accessToken = null;
    throw new ApiError(401, 'Tu sesión expiró. Inicia sesión de nuevo.');
  }

  if (res.status === 204) return undefined as T;

  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    const message = payload && typeof payload === 'object' && 'message' in payload
      ? String((payload as { message: string }).message)
      : 'No se pudo completar la operación.';
    throw new ApiError(res.status, message);
  }
  return payload as T;
}
