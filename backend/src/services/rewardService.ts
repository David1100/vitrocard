import { prisma } from '../config/prisma';
import type { UserRef } from '../utils/jwt';
import { AppError } from '../middlewares/errorHandler';
import { RewardRepository } from '../repositories/rewardRepository';
import { audit } from './customerService';
import type { RedeemRewardInput } from '../validators/rewardValidator';

export class RewardService {
  constructor(private readonly rewards: RewardRepository) {}

  /** Datos para la pantalla de validación de canje (búsqueda por documento). */
  async listByDocument(document: string) {
    const result = await this.rewards.listAvailableByDocument(document);
    if (!result) {
      // Mensaje neutro: no revelar si el cliente existe o no.
      throw new AppError(404, 'No hay recompensas pendientes para ese documento.');
    }
    if (result.rewards.length === 0) {
      throw new AppError(404, 'No hay recompensas pendientes para ese documento.');
    }
    return result;
  }

  /** Canje: único, auditable, quién/cuándo/dónde/qué. */
  async redeem(id: bigint, input: RedeemRewardInput, user: UserRef) {
    const found = await this.rewards.findRedeemable(id);
    if (!found) throw new AppError(404, 'Recompensa no encontrada.');
    if (found.status !== 'DISPONIBLE') {
      throw new AppError(409, 'Esa recompensa ya no está disponible para canje.');
    }

    const salonId = BigInt(input.salonId);
    const salon = await prisma.salon.findUnique({ where: { id: salonId }, select: { id: true, status: true } });
    if (!salon) throw new AppError(404, 'Salón no encontrado.');
    if (salon.status !== 'ACTIVE') throw new AppError(409, 'Ese salón no está activo en este momento.');

    const redeemed = await this.rewards.redeem(id, salonId, BigInt(user.id));

    const detail = await prisma.customerReward.findUnique({
      where: { id },
      select: {
        reward: { select: { name: true } },
        salon: { select: { name: true } },
        customer: { select: { firstName: true, lastName: true, document: true } },
      },
    });

    await audit(user, 'REDEEMED_REWARD', 'customerReward', String(id), {
      salonId: String(salonId),
      customerDocument: detail?.customer.document,
    });

    return {
      id: String(redeemed.id),
      status: redeemed.status,
      redeemedAt: redeemed.redeemedAt,
      rewardName: detail?.reward.name ?? '',
      salonName: detail?.salon.name ?? '',
      customerName: `${detail?.customer.firstName ?? ''} ${detail?.customer.lastName ?? ''}`.trim(),
    };
  }
}
