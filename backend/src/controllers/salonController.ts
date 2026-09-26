import type { Request, Response } from 'express';
import { ZodError } from 'zod';
import { asyncHandler, AppError } from '../middlewares/errorHandler';
import { SalonService } from '../services/salonService';
import { SalonRepository } from '../repositories/salonRepository';
import type { UserRef } from '../utils/jwt';
import { createSalonSchema, updateSalonSchema, listSalonsQuerySchema } from '../validators/salonValidator';
import { requiredParamId } from '../utils/params';

const service = new SalonService(new SalonRepository());

function toMessage(err: unknown): never {
  if (err instanceof ZodError) {
    const first = err.issues[0];
    throw new AppError(400, first ? first.message : 'Datos inválidos.');
  }
  throw err;
}

export class SalonController {
  /** GET /api/salons/qr/:code — público, solo nombre del salón activo. */
  lookupQr = asyncHandler(async (req: Request, res: Response) => {
    const code = (Array.isArray(req.params['code']) ? req.params['code'][0] : req.params['code']) ?? '';
    if (!/^[A-Za-z0-9_-]{4,32}$/.test(code)) {
      throw new AppError(404, 'Código no válido o salón no disponible.');
    }
    res.json(await service.findByQrCode(code));
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    try {
      const input = createSalonSchema.parse(req.body);
      const salon = await service.create(input, req.user as UserRef);
      res.status(201).json({ message: 'Salón creado correctamente.', salon });
    } catch (err) {
      toMessage(err);
    }
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    try {
      const input = updateSalonSchema.parse(req.body);
      const salon = await service.update(requiredParamId(req), input, req.user as UserRef);
      res.json({ message: 'Salón actualizado correctamente.', salon });
    } catch (err) {
      toMessage(err);
    }
  });

  setStatus = asyncHandler(async (req: Request, res: Response) => {
    const status = req.body['status'] === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const result = await service.setStatus(requiredParamId(req), status, req.user as UserRef);
    res.json({ message: status === 'ACTIVE' ? 'Salón activado.' : 'Salón desactivado.', salon: result });
  });

  get = asyncHandler(async (req: Request, res: Response) => {
    const salon = await service.getById(requiredParamId(req));
    if (!salon) throw new AppError(404, 'Salón no encontrado.');
    res.json(salon);
  });

  list = asyncHandler(async (req: Request, res: Response) => {
    try {
      const query = listSalonsQuerySchema.parse(req.query);
      res.json(await service.list(query));
    } catch (err) {
      toMessage(err);
    }
  });
}

export const salonController = new SalonController();
