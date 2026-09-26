import { describe, expect, it } from 'vitest';
import { signAccess, signRefresh, verifyAccess, verifyRefresh } from '../src/utils/jwt';

describe('utils/jwt', () => {
  const user = { id: '1', role: 'SUPER_ADMIN' };

  it('signa y verifica el access token con rol', () => {
    const access = signAccess(user);
    const claims = verifyAccess(access);
    expect(claims.sub).toBe('1');
    expect((claims as unknown as { role: string }).role).toBe('SUPER_ADMIN');
  });

  it('signa y verifica el refresh token con jti único', () => {
    const a = signRefresh(user);
    const b = signRefresh(user);
    expect(verifyRefresh(a.token).sub).toBe('1');
    // jti evita colisiones si se firman en el mismo segundo
    const jtiA = (JSON.parse(atob(a.token.split('.')[1]!)) as { jti: string }).jti;
    const jtiB = (JSON.parse(atob(b.token.split('.')[1]!)) as { jti: string }).jti;
    expect(jtiA).not.toBe(jtiB);
    expect(a.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('rechaza token invalidado por firma', () => {
    const tampered = `${signAccess(user)!.slice(0, -2)}xy`;
    expect(() => verifyAccess(tampered)).toThrow();
  });

  it('rechaza un refresh firmado con el secreto incorrecto', () => {
    const access = signAccess(user);
    expect(() => verifyRefresh(access)).toThrow();
  });
});
