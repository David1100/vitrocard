/** Limpieza de salones de prueba generados por testRewardFlow. */
import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();

async function main(): Promise<void> {
  const testSalons = await p.salon.findMany({ where: { name: { startsWith: 'Salon Test ' } }, select: { id: true } });
  for (const salon of testSalons) {
    await p.customerReward.deleteMany({ where: { salonId: salon.id } });
    await p.visit.deleteMany({ where: { salonId: salon.id } });
    await p.salonMembership.deleteMany({ where: { salonId: salon.id } });
    await p.salon.delete({ where: { id: salon.id } });
  }
  console.log(`eliminados ${testSalons.length} salones de prueba`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => p.$disconnect());
