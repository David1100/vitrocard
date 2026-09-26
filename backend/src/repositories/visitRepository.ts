import { prisma } from '../config/prisma';
import type { Paginated } from './customerRepository';

export interface VisitRow {
  id: string;
  status: 'VALIDA' | 'ANULADA';
  createdAt: Date;
  cancelledBy: string | null;
  customer: { id: string; document: string; firstName: string; lastName: string | null };
  salon: { id: string; name: string };
}

export class VisitRepository {
  /** Visita el mismo cliente + salón ya registrada el día de hoy.  */
  async findTodayVisit(customerId: bigint, salonId: bigint): Promise<boolean> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const found = await prisma.visit.findFirst({
      where: { customerId, salonId, status: 'VALIDA', createdAt: { gte: startOfDay } },
      select: { id: true },
    });
    return found !== null;
  }

  /** Transaccional: crea la visita, hay que proveer customerId ya validado. */
  createTx(data: { customerId: bigint; salonId: bigint; registeredBy: bigint }) {
    return prisma.visit.create({ data, select: { id: true, createdAt: true, status: true } });
  }

  /** Cuenta visitas VÁLIDAS del cliente (para el programa de fidelización). */
  countValid(customerId: bigint): Promise<number> {
    return prisma.visit.count({ where: { customerId, status: 'VALIDA' } });
  }

  async detailForCustomer(customerId: bigint) {
    const visits = await prisma.visit.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        createdAt: true,
        cancelledBy: true,
        salon: { select: { name: true } },
        canceller: { select: { name: true } },
      },
    });
    return visits;
  }

  async list({ search, page, perPage }: { search?: string; page: number; perPage: number }): Promise<Paginated<VisitRow>> {
    const where = search
      ? {
          OR: [
            { customer: { document: { contains: search } } },
            { customer: { firstName: { contains: search } } },
            { customer: { lastName: { contains: search } } },
            { salon: { name: { contains: search } } },
          ],
        }
      : undefined;

    const [rows, total] = await Promise.all([
      prisma.visit.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        skip: (page - 1) * perPage,
        take: perPage,
        include: {
          customer: { select: { id: true, document: true, firstName: true, lastName: true } },
          salon: { select: { id: true, name: true } },
          canceller: { select: { name: true } },
        },
      }),
      prisma.visit.count({ where }),
    ]);

    const items = rows.map((v) => ({
      id: String(v.id),
      status: v.status,
      createdAt: v.createdAt,
      cancelledBy: v.canceller?.name ?? null,
      customer: { ...v.customer, id: String(v.customer.id) },
      salon: { ...v.salon, id: String(v.salon.id) },
    }));

    return { items, page, perPage, total };
  }

  /** Anulación: estado + quién anuló, jamás eliminación física. */
  invalidate(id: bigint, cancelledBy: bigint) {
    return prisma.visit.update({
      where: { id },
      data: { status: 'ANULADA', cancelledBy, cancelledAt: new Date() },
      select: { id: true, status: true },
    });
  }

  async findActive(id: bigint) {
    return prisma.visit.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
  }
}
