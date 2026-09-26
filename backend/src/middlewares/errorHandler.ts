import type { NextFunction, Request, RequestHandler, Response } from 'express';

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ message: 'Recurso no encontrado.' });
}

/** Traducción de mensajes default de Zod (inglés) a español amigable. */
const ZOD_DEFAULT_MESSAGES: Record<string, string> = {
  Required: 'Este campo es obligatorio.',
  Invalid: 'Este campo es inválido.',
  'Invalid email': 'El email no tiene un formato válido.',
};

/** Manejo de errores centralizado: nunca exponer errores técnicos crudos. */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  // Errores de validación (Zod) → 400 con mensaje amigable del primer requisito.
  if (err instanceof Error && err.name === 'ZodError' && 'issues' in err) {
    const issues = (err as { issues: { message: string }[] }).issues;
    const first = issues[0];
    const message = first ? (ZOD_DEFAULT_MESSAGES[first.message] ?? first.message) : 'Datos inválidos.';
    res.status(400).json({ message });
    return;
  }
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }
  console.error('[unhandled]', err);
  res.status(500).json({ message: 'Ocurrió un error inesperado. Intenta más tarde.' });
}

/** Envoltorio para controladores async. */
export const asyncHandler =
  (fn: RequestHandler): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
