import type { Request, Response } from 'express';
import { ZodError } from 'zod';
import { asyncHandler, AppError } from '../middlewares/errorHandler';
import { VisitService } from '../services/visitService';
import { VisitRepository } from '../repositories/visitRepository';
import type { UserRef } from '../utils/jwt';
import { requiredParamId } from '../utils/params';
import { createVisitSchema, listVisitsQuerySchema } from '../validators/visitValidator';

const service = new VisitService(new VisitRepository());

function toMessage(err: unknown): never {
  if (err instanceof ZodError) {
    const first = err.issues[0];
    throw new AppError(400, first ? first.message : 'Datos inválidos.');
  }
  throw err;
}

export class VisitController {
  create = asyncHandler(async (req: Request, res: Response) => {
    try {
      const input = createVisitSchema.parse(req.body);
      const result = await service.register(input, req.user as UserRef);
      res.status(201).json({
        message: 'Visita registrada correctamente.',
        ...result,
      });
    } catch (err) {
      toMessage(err);
    }
  });

  cancel = asyncHandler(async (req: Request, res: Response) => {
    const visit = await service.cancel(BigInt(requiredParamId(req)), req.user as UserRef);
    res.json({ message: 'Visita anulada.', visit });
  });

  list = asyncHandler(async (req: Request, res: Response) => {
    try {
      const query = listVisitsQuerySchema.parse(req.query);
      res.json(await service.list(query));
    } catch (err) {
      toMessage(err);
    }
  });
}

export const visitController = new VisitController();
