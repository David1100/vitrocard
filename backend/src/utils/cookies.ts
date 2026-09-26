import type { Response } from 'express';
import { env } from '../config/env';
import type { UserRef } from '../utils/jwt';

export const REFRESH_COOKIE = 'vitro_rt';

const IS_PROD = env.nodeEnv === 'production';

/** Envía el refresh token en cookie HttpOnly: nunca en localStorage. */
export function sendRefreshCookie(res: Response, token: string, maxAgeMs: number): void {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'strict',
    path: '/api/auth',
    maxAge: maxAgeMs,
  });
}

export function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
}
