import crypto from 'node:crypto';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { hashPassword, verifyPassword } from '../utils/crypto';
import type { UserRef } from '../utils/jwt';

export const USER_ROLE = 'SUPER_ADMIN';

export class AuthRepository {
  async findByEmail(email: string): Promise<UserRef & { passwordHash: string } | null> {
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: { id: true, email: true, name: true, passwordHash: true },
    });
    if (!user) return null;
    return { id: String(user.id), role: USER_ROLE, passwordHash: user.passwordHash };
  }

  async getPublicById(id: string): Promise<{ id: string; email: string; name: string; role: string } | null> {
    const user = await prisma.user.findUnique({
      where: { id: BigInt(id) },
      select: { id: true, email: true, name: true, status: true },
    });
    if (!user || user.status !== 'ACTIVE') return null;
    return { id: String(user.id), email: user.email, name: user.name, role: USER_ROLE };
  }

  async verifyCredentials(email: string, password: string): Promise<UserRef | null> {
    const user = await this.findByEmail(email);
    if (!user) return null;
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) return null;
    return { id: user.id, role: user.role };
  }

  /** Persiste el hash del refresh token. */
  async storeRefresh(userId: string, token: string, expiresAt: Date): Promise<void> {
    await prisma.refreshToken.create({
      data: {
        user: { connect: { id: BigInt(userId) } },
        tokenHash: token,
        expiresAt,
      },
    });
  }

  async isValidRefresh(token: string): Promise<UserRef | null> {
    const record = await prisma.refreshToken.findUnique({
      where: { tokenHash: token },
      select: { id: true, userId: true, revokedAt: true, expiresAt: true },
    });
    if (!record || record.revokedAt || record.expiresAt < new Date()) return null;
    const pub = await this.getPublicById(String(record.userId));
    if (!pub) return null;
    return { id: pub.id, role: USER_ROLE };
  }

  /** Rotación: revoca el actual y devuelve uno nuevo para el usuario. */
  async rotateRefresh(oldToken: string, newToken: string, newExpiresAt: Date): Promise<void> {
    const record = await prisma.refreshToken.findUnique({ where: { tokenHash: oldToken } });
    if (!record) return;
    await prisma.$transaction([
      prisma.refreshToken.update({ where: { id: record.id }, data: { revokedAt: new Date() } }),
      prisma.refreshToken.create({
        data: { user: { connect: { id: record.userId } }, tokenHash: newToken, expiresAt: newExpiresAt },
      }),
    ]);
  }

  /** Revoca todos los refresh tokens de un usuario (logout global). */
  async revokeAll(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { userId: BigInt(userId), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /** Registra en audit_log el intento fallido decisión de seguridad. */
  async auditLogin(user: UserRef | null, ip?: string): Promise<void> {
    if (!env.corsOrigin) return;
    await prisma.auditLog.create({
      data: { user: user ? { connect: { id: BigInt(user.id) } } : undefined, action: 'LOGGED_IN', entity: 'session', metadata: { ip } },
    });
  }

  async countUsers(): Promise<number> {
    return prisma.user.count();
  }

  async createFirstAdmin(email: string, password: string, name: string): Promise<void> {
    await prisma.user.create({
      data: { email: email.toLowerCase(), passwordHash: await hashPassword(password), name },
    });
  }
}
