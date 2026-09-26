import { AuthRepository } from '../repositories/authRepository';
import { env } from '../config/env';
import { newOpaqueToken, refreshHash } from '../utils/crypto';
import { REFRESH_TTL_DAYS, signAccess, signRefresh, verifyRefresh } from '../utils/jwt';
import { AppError } from '../middlewares/errorHandler';
import { sendRefreshCookie, clearRefreshCookie, REFRESH_COOKIE } from '../utils/cookies';
import type { UserRef } from '../utils/jwt';
import type { Request, Response } from 'express';

const repo = new AuthRepository();

export class AuthService {
  async login(body: { email: string; password: string }, res: Response) {
    const user = await repo.verifyCredentials(body.email, body.password);

    // Mensaje uniforme: no revelar si el email existe o no.
    if (!user) {
      res.status(401).json({ message: 'Credenciales incorrectas.' });
      return;
    }

    const access = signAccess(user);
    const { token: refresh, expiresAt } = signRefresh(user);
    await repo.storeRefresh(user.id, refreshHash(refresh), expiresAt);
    sendRefreshCookie(res, refresh, REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);

    const pub = await repo.getPublicById(user.id);
    return { accessToken: access, user: pub };
  }

  async refresh(req: Request, res: Response) {
    const raw = req.cookies?.[REFRESH_COOKIE];
    if (typeof raw !== 'string' || raw.length < 20) {
      res.status(401).json({ message: 'Sesión no válida. Inicia sesión de nuevo.' });
      return;
    }

    let claims;
    try {
      claims = verifyRefresh(raw); // firma
    } catch {
      clearRefreshCookie(res);
      res.status(401).json({ message: 'Sesión expirada. Inicia sesión de nuevo.' });
      return;
    }

    // Validamos contra BD: rotación de tokens
    const user = await repo.isValidRefresh(refreshHash(raw));
    if (!user || user.id !== claims.sub) {
      clearRefreshCookie(res);
      res.status(401).json({ message: 'Sesión no válida. Inicia sesión de nuevo.' });
      return;
    }

    const newAccess = signAccess(user);
    const { token: newRefresh, expiresAt } = signRefresh(user);
    await repo.rotateRefresh(refreshHash(raw), refreshHash(newRefresh), expiresAt);
    sendRefreshCookie(res, newRefresh, REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);

    const pub = await repo.getPublicById(user.id);
    return { accessToken: newAccess, user: pub };
  }

  async logout(req: Request, res: Response) {
    const raw = req.cookies?.[REFRESH_COOKIE];
    if (typeof raw === 'string' && raw.length >= 20) {
      const claims: { sub?: string } | null = (() => {
        try {
          return verifyRefresh(raw) as { sub?: string };
        } catch {
          return null;
        }
      })();
      if (claims?.sub) await repo.revokeAll(claims.sub);
    }
    clearRefreshCookie(res);
    res.status(204).send();
  }

  async me(user: UserRef) {
    const pub = await repo.getPublicById(user.id);
    if (!pub) throw new AppError(401, 'Sesión no válida.');
    return pub;
  }

  /** Siembra el primer SUPER_ADMIN si la base está vacía (solo la primera vez). */
  async seedInitialAdmin(): Promise<boolean> {
    if ((await repo.countUsers()) > 0) return false;
    await repo.createFirstAdmin(env.seedEmail ?? 'admin@vitro.com', env.seedPassword ?? 'VitroAdmin2026!', 'Vitro Admin');
    return true;
  }
}

export const authService = new AuthService();
