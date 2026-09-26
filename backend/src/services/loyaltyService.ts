import { prisma } from '../config/prisma';
import { AppError } from '../middlewares/errorHandler';
import type { UserRef } from '../utils/jwt';
import type { UpdateLoyaltyProgramInput } from '../validators/loyaltyValidator';
import { audit } from './customerService';

export interface LoyaltyLookup {
  name: string;
  visits: number;
  requiredVisits: number;
  salonName: string | null;
  rewardsAvailable: number;
}

export class LoyaltyService {
  /** Regla activa del programa (creada por seed o configuración). */
  async getConfig(): Promise<{ id: string; name: string; requiredVisits: number; isActive: boolean }> {
    const program = await prisma.loyaltyProgram.findFirst({ where: { isActive: true } });
    if (!program) {
      throw new AppError(503, 'Aún no hay un programa de fidelización configurado.');
    }
    return {
      id: String(program.id),
      name: program.name,
      requiredVisits: program.requiredVisits,
      isActive: program.isActive,
    };
  }

  async ensureDefaultProgram(): Promise<void> {
    const count = await prisma.loyaltyProgram.count();
    if (count === 0) {
      await prisma.loyaltyProgram.create({ data: { name: 'Programa Estándar', requiredVisits: 12 } });
    }
    // Asegura una recompensa por defecto asociada a 12 visitas.
    const reward = await prisma.reward.findFirst({ where: { requiredVisits: 12 } });
    if (!reward) {
      await prisma.reward.create({
        data: { name: 'Recompensa por 12 visitas', description: 'Recompensa del programa estándar.', requiredVisits: 12 },
      });
    }
  }

  async update(input: UpdateLoyaltyProgramInput, user: UserRef) {
    const existing = await prisma.loyaltyProgram.findFirst({ where: { isActive: true } });
    if (!existing) throw new AppError(404, 'Programa no encontrado.');

    const updated = await prisma.loyaltyProgram.update({
      where: { id: existing.id },
      data: { requiredVisits: input.requiredVisits, isActive: input.isActive ?? true },
    });

    // Sincroniza la recompensa asociada a la nueva regla.
    const reward = await prisma.reward.findFirst({ where: { requiredVisits: updated.requiredVisits } });
    if (!reward) {
      await prisma.reward.create({
        data: {
          name: `Recompensa por ${updated.requiredVisits} visitas`,
          description: 'Recompensa del programa estándar.',
          requiredVisits: updated.requiredVisits,
        },
      });
    }

    await audit(user, 'UPDATED_LOYALTY_PROGRAM', 'loyaltyProgram', String(updated.id), { requiredVisits: updated.requiredVisits });
    return { id: String(updated.id), name: updated.name, requiredVisits: updated.requiredVisits, isActive: updated.isActive };
  }

  /**
   * Consulta pública ANÓNIMA por documento: devuelve solo sellos/visitas y
   * recompensas pendientes, sin datos sensibles. Mensaje neutro si no existe.
   */
  async lookupByDocument(document: string): Promise<LoyaltyLookup> {
    const customer = await prisma.customer.findUnique({
      where: { document },
      select: { id: true, firstName: true, lastName: true, status: true },
    });

    if (!customer || customer.status !== 'ACTIVE') {
      throw new AppError(404, 'No encontramos visitas asociadas a ese documento.');
    }

    const [visits, program, rewards] = await Promise.all([
      prisma.visit.count({ where: { customerId: customer.id, status: 'VALIDA' } }),
      this.getConfig().catch(() => null),
      prisma.customerReward.count({ where: { customerId: customer.id, status: 'DISPONIBLE' } }),
    ]);

    const lastSalon = visits > 0
      ? await prisma.visit.findFirst({
          where: { customerId: customer.id, status: 'VALIDA' },
          orderBy: { createdAt: 'desc' },
          select: { salon: { select: { name: true } } },
        })
      : null;

    return {
      name: `${customer.firstName} ${customer.lastName ?? ''}`.trim(),
      visits,
      requiredVisits: program?.requiredVisits ?? 12,
      salonName: lastSalon?.salon.name ?? null,
      rewardsAvailable: rewards,
    };
  }
}
