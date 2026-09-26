import { prisma } from '../config/prisma';

export interface AvailableRewardRow {
  id: string;
  earnedAt: Date;
  rewardName: string;
  rewardDescription: string | null;
  requiredVisits: number;
  salonName: string;
}

export class RewardRepository {
  /** Recompensas DISPONIBLES de un cliente por su documento (búsqueda de canje). */
  async listAvailableByDocument(document: string): Promise<{ customer: { id: string; firstName: string; lastName: string | null }; rewards: AvailableRewardRow[] } | null> {
    const customer = await prisma.customer.findUnique({
      where: { document },
      select: { id: true, firstName: true, lastName: true },
    });
    if (!customer) return null;

    const rows = await prisma.customerReward.findMany({
      where: { customerId: customer.id, status: 'DISPONIBLE' },
      orderBy: { earnedAt: 'asc' },
      include: {
        reward: { select: { name: true, description: true, requiredVisits: true } },
        salon: { select: { name: true } },
      },
    });

    return {
      customer: { ...customer, id: String(customer.id) },
      rewards: rows.map((r) => ({
        id: String(r.id),
        earnedAt: r.earnedAt,
        rewardName: r.reward.name,
        rewardDescription: r.reward.description,
        requiredVisits: r.reward.requiredVisits,
        salonName: r.salon.name,
      })),
    };
  }

  /** Único escritor del canje: transición DISPONIBLE → CANJEADA. */
  async redeem(id: bigint, salonId: bigint, redeemedBy: bigint) {
    return prisma.customerReward.update({
      where: { id },
      data: { status: 'CANJEADA', redeemedAt: new Date(), redeemedBy, salonId },
      select: { id: true, status: true, redeemedAt: true },
    });
  }

  /** Verificación atómica: sólo DISPONIBLE puede canjearse (nunca dos veces). */
  async findRedeemable(id: bigint) {
    return prisma.customerReward.findUnique({
      where: { id },
      select: { id: true, status: true, customerId: true, customer: { select: { document: true } } },
    });
  }
}
