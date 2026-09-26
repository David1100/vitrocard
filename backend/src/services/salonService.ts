import { randomBytes } from 'node:crypto';
import type { UserRef } from '../utils/jwt';
import { AppError } from '../middlewares/errorHandler';
import { SalonRepository } from '../repositories/salonRepository';
import type { CreateSalonInput, UpdateSalonInput } from '../validators/salonValidator';
import { slugify } from '../validators/salonValidator';
import { audit } from './customerService';

export class SalonService {
  constructor(private readonly salons: SalonRepository) {}

  /** Identificador para el QR: aleatorio en base64url, NO incremental. */
  private generateQrCode(): string {
    return randomBytes(8).toString('base64url');
  }

  private async ensureQr(): Promise<string> {
    let code = this.generateQrCode();
    // Reintento ante colisión teórica (espacio ~2^64).
    let tries = 3;
    while ((await this.salons.existsQrCode(code)) && tries-- > 0) {
      code = this.generateQrCode();
    }
    if ((await this.salons.existsQrCode(code))) {
      throw new AppError(500, 'No pudimos generar el código del salón. Intenta de nuevo.');
    }
    return code;
  }

  async create(input: CreateSalonInput, user: UserRef) {
    const slug = slugify(input.name);
    if (await this.salons.existsSlug(slug)) {
      throw new AppError(409, 'Ya existe un salón con un nombre similar (slug duplicado).');
    }
    const qrCode = await this.ensureQr();
    const salon = await this.salons.create({ ...input, slug, qrCode });
    await audit(user, 'CREATED_SALON', 'salon', String(salon.id), { name: input.name });
    return { ...salon, id: String(salon.id) };
  }

  async update(id: string, input: UpdateSalonInput, user: UserRef) {
    await this.requireExisting(id);

    let slug: string | undefined;
    if (input.name) {
      slug = slugify(input.name);
      if (await this.salons.slugTaken(slug, BigInt(id))) {
        throw new AppError(409, 'Ya existe otro salón con ese nombre (slug duplicado).');
      }
    }

    await this.salons.update(BigInt(id), { ...input, slug });
    await audit(user, 'UPDATED_SALON', 'salon', id);
    return this.getById(id);
  }

  async setStatus(id: string, status: 'ACTIVE' | 'INACTIVE', user: UserRef) {
    await this.requireExisting(id);
    await this.salons.update(BigInt(id), { status });
    await audit(user, status === 'ACTIVE' ? 'ACTIVATED_SALON' : 'DEACTIVATED_SALON', 'salon', id);
    return { id, status };
  }

  /** Público: bienvenida escaneando el QR. Solo nombre, solo salones activos. */
  async findByQrCode(qrCode: string) {
    const salon = await this.salons.findActiveByQrCode(qrCode);
    if (!salon || salon.status !== 'ACTIVE') {
      throw new AppError(404, 'Código no válido o salón no disponible.');
    }
    return { name: salon.name };
  }

  async getById(id: string) {
    const found = await this.salons.list({ search: undefined, page: 1, perPage: 1 });
    return found.items.find((s) => s.id === id) ?? null;
  }

  async list(query: { search?: string; page: number; perPage: number }) {
    return this.salons.list(query);
  }

  private async requireExisting(id: string): Promise<void> {
    const found = await this.getById(id);
    if (!found) {
      throw new AppError(404, 'Salón no encontrado.');
    }
  }
}
