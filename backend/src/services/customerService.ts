import { prisma } from '../config/prisma';
import type { UserRef } from '../utils/jwt';
import { AppError } from '../middlewares/errorHandler';
import type { CustomerRepository } from '../repositories/customerRepository';
import type { CreateCustomerInput, UpdateCustomerInput, ListCustomersQuery } from '../validators/customerValidator';

/** Escribe en audit_logs sin datos sensibles. */
export async function audit(user: UserRef, action: string, entity: string, entityId: string, metadata?: Record<string, unknown>): Promise<void> {
  await prisma.auditLog.create({
    data: {
      user: { connect: { id: BigInt(user.id) } },
      action,
      entity,
      entityId: BigInt(entityId),
      metadata: metadata as never,
    },
  });
}

export class CustomerService {
  constructor(private readonly customers: CustomerRepository) {}

  async create(input: CreateCustomerInput, user: UserRef) {
    if (await this.customers.existsDocument(input.document)) {
      throw new AppError(409, 'Ya existe un cliente con ese documento.');
    }
    const created = await this.customers.create(input);
    await audit(user, 'CREATED_CUSTOMER', 'customer', String(created.id));
    const full = await this.customers.findWithStats(created.id);
    return full;
  }

  async update(id: string, input: UpdateCustomerInput, user: UserRef) {
    await this.requireExisting(id);
    await this.customers.update(BigInt(id), input);
    await audit(user, 'UPDATED_CUSTOMER', 'customer', id);
    return this.customers.findWithStats(BigInt(id));
  }

  /** Corrección sin eliminación física. */
  async setStatus(id: string, status: 'ACTIVE' | 'INACTIVE', user: UserRef) {
    await this.requireExisting(id);
    await this.customers.update(BigInt(id), { status });
    await audit(user, status === 'ACTIVE' ? 'ACTIVATED_CUSTOMER' : 'DEACTIVATED_CUSTOMER', 'customer', id);
    return { id, status };
  }

  async get(id: string) {
    return this.customers.findWithStats(BigInt(id));
  }

  async list(query: ListCustomersQuery) {
    return this.customers.list(query);
  }

  private async requireExisting(id: string): Promise<void> {
    const found = await this.customers.findWithStats(BigInt(id));
    if (!found) {
      throw new AppError(404, 'Cliente no encontrado.');
    }
  }
}
