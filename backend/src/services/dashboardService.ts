import { prisma } from '../config/prisma';

export interface DashboardStats {
  activeSalons: number;
  activeCustomers: number;
  totalVisits: number;
  visitsToday: number;
  visitsLast7: number;
  visitsByDay: { date: string; count: number }[];
  visitsBySalon: { salonName: string; count: number }[];
  rewardsByStatus: { status: string; count: number }[];
}

export class DashboardService {
  private startOfDay(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private daysAgo(days: number): Date {
    const d = this.startOfDay();
    d.setDate(d.getDate() - days);
    return d;
  }

  /** Agregados del dashboard SUPER_ADMIN. Lectura pura, sin datos sensibles. */
  async stats(): Promise<DashboardStats> {
    const [activeSalons, activeCustomers, totalVisits, visitsToday, visitsLast7] = await Promise.all([
      prisma.salon.count({ where: { status: 'ACTIVE' } }),
      prisma.customer.count({ where: { status: 'ACTIVE' } }),
      prisma.visit.count({ where: { status: 'VALIDA' } }),
      prisma.visit.count({ where: { status: 'VALIDA', createdAt: { gte: this.startOfDay() } } }),
      prisma.visit.count({ where: { status: 'VALIDA', createdAt: { gte: this.daysAgo(6) } } }),
    ]);

    // Serie de 14 días: agrupar en JS evita raw SQL y mantiene tipos seguros.
    const recent = await prisma.visit.findMany({
      where: { status: 'VALIDA', createdAt: { gte: this.daysAgo(13) } },
      select: { createdAt: true },
    });

    const buckets = new Map<string, number>();
    for (let i = 13; i >= 0; i--) {
      buckets.set(this.daysAgo(i).toISOString().slice(0, 10), 0);
    }
    for (const v of recent) {
      const key = v.createdAt.toISOString().slice(0, 10);
      if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
    const visitsByDay = [...buckets.entries()].map(([date, count]) => ({ date, count }));

    const bySalonRows = await prisma.visit.groupBy({
      by: ['salonId'],
      where: { status: 'VALIDA' },
      _count: { _all: true },
    });
    const salons = await prisma.salon.findMany({
      where: { id: { in: bySalonRows.map((r) => r.salonId) } },
      select: { id: true, name: true },
    });
    const nameById = new Map(salons.map((s) => [String(s.id), s.name]));
    const visitsBySalon = bySalonRows
      .map((r) => ({ salonName: nameById.get(String(r.salonId)) ?? '—', count: r._count._all }))
      .sort((a, b) => b.count - a.count);

    const rewards = await prisma.customerReward.groupBy({ by: ['status'], _count: { _all: true } });

    return {
      activeSalons,
      activeCustomers,
      totalVisits,
      visitsToday,
      visitsLast7,
      visitsByDay,
      visitsBySalon,
      rewardsByStatus: rewards.map((r) => ({ status: r.status, count: r._count._all })),
    };
  }
}
