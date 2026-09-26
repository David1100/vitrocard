import { afterEach, describe, expect, it, vi } from 'vitest';
import { lookupByDocument, validateDocument } from './loyalty';

describe('validateDocument', () => {
  it('acepta documentos de 6 a 12 dígitos', () => {
    expect(validateDocument('10327644')).toBeNull();
    expect(validateDocument('123456789012')).toBeNull();
  });

  it('rechaza letras, guiones y longitudes fuera de rango', () => {
    expect(validateDocument('abc123')).toBeTruthy();
    expect(validateDocument('1032-764')).toBeTruthy();
    expect(validateDocument('12345')).toBeTruthy();
    expect(validateDocument('1234567890123')).toBeTruthy();
  });
});

describe('lookupByDocument (cliente HTTP)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('traduce 404 a un mensaje neutro que no revela existencia', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 404 })));
    await expect(lookupByDocument('999999')).rejects.toThrow(
      'No encontramos visitas asociadas a ese documento.',
    );
  });

  it('traduce fallo de red a un mensaje amigable (sin errores crudos)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(lookupByDocument('103276')).rejects.toThrow(
      'No pudimos conectar con la plataforma. Revisa tu conexión.',
    );
  });

  it('devuelve el resultado en respuestas exitosas', async () => {
    const body = { name: 'David', visits: 8, requiredVisits: 12, salonName: 'Aurora', rewardsAvailable: 0 };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status: 200 })));
    const result = await lookupByDocument('103276');
    expect(result).toEqual(body);
  });
});
