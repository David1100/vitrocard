import bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'node:crypto';

const SALT_ROUNDS = 12;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/** Hash del refresh token a almacenar (nunca el token plano en BD). */
export function refreshHash(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function newOpaqueToken(): string {
  return randomBytes(48).toString('base64url');
}
