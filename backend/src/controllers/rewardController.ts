import type { Request, Response } from 'express';
import { ZodError } from 'zod';
import { asyncHandler, AppError } from '../middlewares/errorHandler';
import { RewardService } from '../services/rewardService';
import { RewardRepository } from '../repositories/rewardRepository';
import type { UserRef } from '../utils/jwt';
import { requiredParamId } from '../utils/params';
import { redeemRewardSchema } from '../validators/rewardValidator';

const service = new RewardService(new RewardRepository());

function toMessage(err: unknown): never {
  if (err instanceof ZodError) {
    const first = err.issues[0];
    throw new AppError(400, first ? first.message : 'Datos inválidos.');
  }
  throw err;
}

export class RewardController {
  /** GET /api/rewards/customer/:document — recompensas DISPONIBLES del cliente. */
  list = asyncHandler(async (req: Request, res: Response) => {
    const document = (Array.isArray(req.params['document']) ? req.params['document'][0] : req.params['document']) ?? '';
    if (!/^\d{6,12}$/.test(document)) {
      throw new AppError(400, 'Documento inválido.');
    }
    const result = await service.listByDocument(document);
    res.json(result);
  });

  /** POST /api/rewards/:id/redeem — canje único con auditoría. */
  redeem = asyncHandler(async (req: Request, res: Response) => {
    try {
      const input = redeemRewardSchema.parse(req.body);
      const result = await service.redeem(BigInt(requiredParamId(req)), input, req.user as UserRef);
      res.json({ message: 'Recompensa canjeada correctamente.', ...result });
    } catch (err) {
      toMessage(err);
    }
  });
}

export const rewardController = new RewardController();
