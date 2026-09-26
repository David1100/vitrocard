/**
 * Siembra el primer SUPER_ADMIN si la base no tiene usuarios.
 * Uso: npx tsx src/scripts/seedAdmin.ts
 */
import { env } from '../config/env';
import { AuthService } from '../services/authService';

async function main(): Promise<void> {
  const service = new AuthService();
  const created = await service.seedInitialAdmin();
  if (created) {
    console.log(`SUPER_ADMIN inicial creado: ${env.seedEmail ?? 'admin@vitro.com'}`);
  } else {
    console.log('Ya existe al menos un usuario; seed omitido.');
  }
}

main()
  .catch((err) => {
    console.error('Seed falló:', err);
    process.exitCode = 1;
  })
  .finally(() => process.exit());
