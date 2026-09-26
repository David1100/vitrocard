import { prisma } from '../config/prisma';
import type { Paginated } from './customerRepository';

export interface SalonRow {
  id: string;
  name: string;
  slug: string;
  qrCode: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  status: string;
  createdAt: Date;
}

export class SalonRepository {
  create(data: {
    name: string;
    slug: string;
    qrCode: string;
    address?: string;
    phone?: string;
    email?: string;
  }) {
    return prisma.salon.create({ data });
  }

  update(
    id: bigint,
    data: { name?: string; slug?: string; address?: string; phone?: string; email?: string; status?: 'ACTIVE' | 'INACTIVE' },
  ) {
    return prisma.salon.update({ where: { id }, data });
  }

  async existsSlug(slug: string): Promise<boolean> {
    return (await prisma.salon.findUnique({ where: { slug }, select: { id: true } })) !== null;
  }

  async existsQrCode(qrCode: string): Promise<boolean> {
    return (await prisma.salon.findUnique({ where: { qrCode }, select: { id: true } })) !== null;
  }

  /** Lookup público por código QR: solo nombre (nada sensible). */
  async findActiveByQrCode(qrCode: string) {
    return prisma.salon.findUnique({
      where: { qrCode },
      select: { name: true, status: true },
    });
  }

  async slugTaken(slug: string, excludeId?: bigint): Promise<boolean> {
    return prisma.salon
      .findUnique({ where: { slug }, select: { id: true } })
      .then((found) => found !== null && found.id !== excludeId);
  }

  async list({ search, page, perPage }: { search?: string; page: number; perPage: number }): Promise<Paginated<SalonRow>> {
    const where = search
      ? {
          OR: [{ name: { contains: search } }, { slug: { contains: search } }],
        }
      : undefined;

    const [items, total] = await Promise.all([
      prisma.salon.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        skip: (page - 1) * perPage,
        take: perPage,
        select: {
          id: true,
          name: true,
          slug: true,
          qrCode: true,
          address: true,
          phone: true,
          email: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.salon.count({ where }),
    ]);

    return { items: items.map((s) => ({ ...s, id: String(s.id) })), page, perPage, total };
  }
}
