import { apiBaseUrl } from './api';

/** Tipos de dominio — consulta pública de fidelización. */
export interface LookupResult {
  name?: string;
  visits: number;
  requiredVisits: number;
  salonName?: string;
  rewardsAvailable: number;
}

export type LookupState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; result: LookupResult }
  | { status: 'error'; message: string };

const DOC_PATTERN = /^\d{6,12}$/;
const API_BASE = apiBaseUrl();

export function validateDocument(value: string): string | null {
  if (!DOC_PATTERN.test(value)) return 'Ingresa un número de documento válido (solo números).';
  return null;
}

/**
 * Consulta pública y anónima. Mensaje neutro si no existe:
 * no se revela si el documento está registrado o no.
 */
export async function lookupByDocument(document: string): Promise<LookupResult> {
  try {
    const res = await fetch(`${API_BASE}/loyalty/lookup/${encodeURIComponent(document)}`);
    if (res.status === 404) {
      throw new Error('No encontramos visitas asociadas a ese documento.');
    }
    if (!res.ok) {
      throw new Error('No pudimos consultar tu tarjeta. Intenta de nuevo en unos minutos.');
    }
    return (await res.json()) as LookupResult;
  } catch (err) {
    if (err instanceof TypeError) {
      throw new Error('No pudimos conectar con la plataforma. Revisa tu conexión.');
    }
    throw err;
  }
}
