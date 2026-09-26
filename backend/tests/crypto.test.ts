import { describe, expect, it } from 'vitest';
import { hashPassword, newOpaqueToken, refreshHash, verifyPassword } from '../src/utils/crypto';

describe('utils/crypto', () => {
  it('hashea y verifica contraseñas (nunca texto plano)', async () => {
    const hash = await hashPassword('VitroAdmin2026!');
    expect(hash).not.toBe('VitroAdmin2026!');
    expect(await verifyPassword('VitroAdmin2026!', hash)).toBe(true);
    expect(await verifyPassword(' incorrecta', hash)).toBe(false);
  });

  it('refreshHash es determinista y sensible al token', () => {
    const token = 'abc123';
    expect(refreshHash(token)).toBe(refreshHash(token));
    expect(refreshHash(token)).not.toBe(refreshHash(`${token}x`));
  });

  it('refreshHash produce 64 hex chars (sha256)', () => {
    expect(refreshHash(newOpaqueToken())).toMatch(/^[a-f0-9]{64}$/);
  });

  it('newOpaqueToken genera identificadores de longitud esperada', () => {
    expect(newOpaqueToken()).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});
