import jwt, { type SignOptions } from 'jsonwebtoken';
import { randomBytes } from 'node:crypto';
import { env } from '../config/env';

export type AccessTokenPayload = { sub: string };

export type RefreshTokenPair = { access: string; refresh: string };

const ACCESS_TTL: SignOptions = { expiresIn: '15m' };
const REFRESH_TTL_DAYS = 7;

export function signAccess(user: UserRef): string {
  return jwt.sign({ sub: user.id, role: user.role }, env.jwtSecret, ACCESS_TTL);
}

export function signRefresh(user: UserRef): { token: string; expiresAt: Date } {
  // jti único: evita colisiones si dos tokens se emiten en el mismo segundo.
  const token = jwt.sign(
    { sub: user.id, type: 'refresh', jti: randomBytes(12).toString('hex') },
    env.jwtRefreshSecret,
    { expiresIn: `${REFRESH_TTL_DAYS}d` },
  );
  const claims = jwt.decode(token) as { exp?: number };
  const expiresAt = new Date((claims.exp ?? 0) * 1000);
  return { token, expiresAt };
}

export function verifyAccess(token: string): AccessTokenPayload {
  return jwt.verify(token, env.jwtSecret) as AccessTokenPayload;
}

export function verifyRefresh(token: string): AccessTokenPayload {
  return jwt.verify(token, env.jwtRefreshSecret) as AccessTokenPayload;
}

/** Datos mínimos con los que se emiten tokens. */
export type UserRef = { id: string; role: string };

/** Días de vida del refresh token, para persistencia. */
export { REFRESH_TTL_DAYS };
