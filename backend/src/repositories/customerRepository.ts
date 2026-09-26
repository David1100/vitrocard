import { prisma } from '../config/prisma';

export interface Paginated<T> {
  items: T[];
  page: number;
  perPage: number;
  total: number;
}

export class CustomerRepository {
  async existsDocument(document: string): Promise<boolean> {
    const found = await prisma.customer.findUnique({ where: { document }, select: { id: true } });
    return found !== null;
  }

  create(data: { document: string; firstName: string; lastName?: string; phone?: string }) {
    return prisma.customer.create({ data });
  }

  update(id: bigint, data: { firstName?: string; lastName?: string; phone?: string; status?: 'ACTIVE' | 'INACTIVE' }) {
    return prisma.customer.update({ where: { id }, data });
  }

  /** Búsqueda flexible: documento exacto o nombre parcial (solo no eliminados, estado en filtros). */
  async list({ search, page, perPage }: { search?: string; page: number; perPage: number }): Promise<Paginated<{
    id: string;
    document: string;
    firstName: string;
    lastName: string | null;
    phone: string | null;
    status: string;
    createdAt: Date;
  }>> {
    const where = search
      ? {
          OR: [
            { document: { contains: search } },
            { firstName: { contains: search } },
            { lastName: { contains: search } },
          ],
        }
      : undefined;

    const [items, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        skip: (page - 1) * perPage,
        take: perPage,
        select: { id: true, document: true, firstName: true, lastName: true, phone: true, status: true, createdAt: true },
      }),
      prisma.customer.count({ where }),
    ]);

    return {
      items: items.map((c) => ({ ...c, id: String(c.id) })),
      page,
      perPage,
      total,
    };
  }

  async findWithStats(id: bigint) {
    const customer = await prisma.customer.findUnique({
      where: { id },
      select: { id: true, document: true, firstName: true, lastName: true, phone: true, status: true, createdAt: true },
    });
    if (!customer) return null;

    const visits = await prisma.visit.count({ where: { customerId: id, status: 'VALIDA' } });
    const rewards = await prisma.customerReward.count({
      where: { customerId: id, status: 'DISPONIBLE' },
    });

    return { ...customer, id: String(customer.id), visits, rewardsAvailable: rewards };
  }
}
