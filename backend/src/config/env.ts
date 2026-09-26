import 'dotenv/config';

function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Variable de entorno requerida no definida: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 3000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  databaseUrl: requireEnv('DATABASE_URL', 'mysql://root:root@localhost:3306/vitro'),
  jwtSecret: requireEnv('JWT_ACCESS_SECRET', 'dev-only-secret'),
  jwtRefreshSecret: requireEnv('JWT_REFRESH_SECRET', 'dev-only-secret-refresh'),
  corsOrigin: requireEnv('CORS_ORIGIN', 'http://localhost:4321'),
  /** Orígenes extra autorizados, separados por coma. */
  corsOrigins: (process.env.CORS_ORIGIN ?? 'http://localhost:4321').split(',').map((o) => o.trim()),
  seedEmail: process.env.ADMIN_SEED_EMAIL,
  seedPassword: process.env.ADMIN_SEED_PASSWORD,
} as const;
