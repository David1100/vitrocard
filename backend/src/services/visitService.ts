import { prisma } from '../config/prisma';
import type { UserRef } from '../utils/jwt';
import { AppError } from '../middlewares/errorHandler';
import { VisitRepository } from '../repositories/visitRepository';
import { audit } from './customerService';
import type { CreateVisitInput, ListVisitsQuery } from '../validators/visitValidator';

export class VisitService {
  constructor(private readonly visits: VisitRepository) {}

  /**
   * Registra una visita validando: salón activo, cliente activo, duplicidad del
   * día. Genera automáticamente la recompensa cuando se completan las visitas
   * requeridas del programa (transacción), y audita la acción.
   */
  async register(input: CreateVisitInput, user: UserRef) {
    const salonId = BigInt(input.salonId);
    const salon = await prisma.salon.findUnique({
      where: { id: salonId },
      select: { id: true, status: true },
    });
    if (!salon) throw new AppError(404, 'Salón no encontrado.');
    if (salon.status !== 'ACTIVE') throw new AppError(409, 'Ese salón no está activo en este momento.');

    const customer = await prisma.customer.findUnique({
      where: { document: input.document },
      select: { id: true, status: true },
    });
    if (!customer) throw new AppError(404, 'No hay un cliente con ese documento.');
    if (customer.status !== 'ACTIVE') throw new AppError(409, 'Ese cliente está inactivo; actívalo primero.');

    if (await this.visits.findTodayVisit(customer.id, salonId)) {
      throw new AppError(409, 'Este cliente ya registró una visita en ese salón hoy.');
    }

    const program = await prisma.loyaltyProgram.findFirst({ where: { isActive: true } });

    const visit = await prisma.$transaction(async (tx) => {
      const created = await tx.visit.create({
        data: { customerId: customer.id, salonId, registeredBy: BigInt(user.id) },
        select: { id: true, createdAt: true, status: true },
      });

      let rewardGenerated = false;
      if (program) {
        const count = await tx.visit.count({ where: { customerId: customer.id, status: 'VALIDA' } });
        if (program.requiredVisits > 0 && count % program.requiredVisits === 0) {
          const reward = await tx.reward.findFirst({
            where: { requiredVisits: program.requiredVisits },
            select: { id: true },
          });
          if (reward) {
            await tx.customerReward.create({
              data: {
                customerId: customer.id,
                rewardId: reward.id,
                salonId,
                status: 'DISPONIBLE',
              },
            });
            rewardGenerated = true;
          }
        }
      }

      return { ...created, rewardGenerated };
    });

    await audit(user, 'REGISTERED_VISIT', 'visit', visit.id.toString(), {
      customerId: String(customer.id),
      salonId: String(salonId),
      rewardGenerated: visit.rewardGenerated,
    });

    return {
      visit: { ...visit, id: String(visit.id) },
      salonName: await prisma.salon.findUnique({ where: { id: salonId }, select: { name: true } }).then((s) => s?.name ?? ''),
      totalVisits: await this.visits.countValid(customer.id),
      requiredVisits: program?.requiredVisits ?? 12,
      rewardGenerated: visit.rewardGenerated,
    };
  }

  /** Corrección: anula la visita y guarda quién lo hizo (sin eliminación física). */
  async cancel(id: bigint, user: UserRef) {
    const visit = await this.visits.findActive(id);
    if (!visit) throw new AppError(404, 'Visita no encontrada.');
    if (visit.status !== 'VALIDA') throw new AppError(409, 'Esa visita ya fue anulada.');

    const updated = await this.visits.invalidate(id, BigInt(user.id));
    await audit(user, 'CANCELLED_VISIT', 'visit', String(id));
    return { ...updated, id: String(updated.id) };
  }

  async list(query: ListVisitsQuery) {
    return this.visits.list(query);
  }

  async lastSalonOf(customerId: string): Promise<string | null> {
    const last = await prisma.visit.findFirst({
      where: { customerId: BigInt(customerId), status: 'VALIDA' },
      orderBy: { createdAt: 'desc' },
      select: { salon: { select: { name: true } } },
    });
    return last?.salon.name ?? null;
  }
}
