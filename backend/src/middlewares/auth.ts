import type { NextFunction, Request, Response } from 'express';
import { verifyAccess } from '../utils/jwt';
import { AppError } from './errorHandler';

/** Extrae el bearer token de la cabecera Authorization. */
function extractBearer(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice('Bearer '.length).trim() || null;
}

/** Middleware de autenticación: exige un access token válido en endpoints administrativos. */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const token = extractBearer(req);
  if (!token) {
    res.status(401).json({ message: 'Debes iniciar sesión para continuar.' });
    return;
  }
  try {
    const claims = verifyAccess(token);
    req.user = { id: claims.sub, role: 'SUPER_ADMIN' };
    next();
  } catch {
    res.status(401).json({ message: 'Tu sesión expiró. Inicia sesión de nuevo.' });
  }
}

/** Middleware de rol (versión v1: solo SUPER_ADMIN; creado para crecer a futuros roles). */
export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError(401, 'Debes iniciar sesión para continuar.'));
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(new AppError(403, 'No tienes permiso para realizar esta acción.'));
      return;
    }
    next();
  };
}
