import type { Request } from 'express';
import { AppError } from '../middlewares/errorHandler';

/** Extrae y valida el parámetro :id como string numérico (texto amigable si no). */
export function requiredParamId(req: Request): string {
  const raw = req.params['id'];
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    throw new AppError(400, 'Identificador inválido.');
  }
  return value;
}
