import type { Request, Response } from 'express';
import { ZodError } from 'zod';
import { asyncHandler, AppError } from '../middlewares/errorHandler';
import { LoyaltyService } from '../services/loyaltyService';
import type { UserRef } from '../utils/jwt';
import { updateLoyaltyProgramSchema } from '../validators/loyaltyValidator';

const service = new LoyaltyService();

function toMessage(err: unknown): never {
  if (err instanceof ZodError) {
    const first = err.issues[0];
    throw new AppError(400, first ? first.message : 'Datos inválidos.');
  }
  throw err;
}

export class LoyaltyController {
  /** GET /api/loyalty/lookup/:document — público, anónimo, solo lectura. */
  lookup = asyncHandler(async (req: Request, res: Response) => {
    const document = (Array.isArray(req.params['document']) ? req.params['document'][0] : req.params['document']) ?? '';
    if (!/^\d{6,12}$/.test(document)) {
      throw new AppError(400, 'Documento inválido.');
    }
    const result = await service.lookupByDocument(document);
    res.json(result);
  });

  /** GET /api/loyalty/config — admin. */
  getConfig = asyncHandler(async (_req: Request, res: Response) => {
    res.json(await service.getConfig());
  });

  /** PATCH /api/loyalty/config — admin, con auditoría. */
  updateConfig = asyncHandler(async (req: Request, res: Response) => {
    try {
      const input = updateLoyaltyProgramSchema.parse(req.body);
      const result = await service.update(input, req.user as UserRef);
      res.json({ message: 'Programa actualizado correctamente.', program: result });
    } catch (err) {
      toMessage(err);
    }
  });
}

export const loyaltyController = new LoyaltyController();
