/**
 * Prueba del flujo real de fidelización vía API:
 * crea 12 salones temporales y registra 12 visitas para Laura,
 * una por salón (respetando la regla anti-duplicidad del día).
 * Al llegar a 12 debe generarse 1 recompensa DISPONIBLE.
 * Uso: npx tsx src/scripts/testRewardFlow.ts   (API corriendo en :3000)
 */
import 'dotenv/config';

const API = 'http://localhost:3000/api';

async function api(path: string, method: 'GET' | 'POST' | 'PATCH' = 'GET', body?: unknown, token?: string): Promise<{ status: number; data: unknown }> {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      ...(body !== undefined && { 'Content-Type': 'application/json' }),
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  return { status: res.status, data };
}

async function main(): Promise<void> {
  const login = await api('/auth/login', 'POST', { email: process.env.ADMIN_SEED_EMAIL, password: process.env.ADMIN_SEED_PASSWORD });
  if (login.status !== 200) throw new Error('login falló');
  const token = (login.data as { accessToken: string }).accessToken;

  // Asegura que Laura esté activa para la prueba.
  const customers = await api('/customers?search=38214790', 'GET', undefined, token);
  const laura = (customers.data as { items: { id: string }[] }).items[0];
  if (laura) {
    await api(`/customers/${laura.id}`, 'PATCH', { status: 'ACTIVE' }, token);
  }

  for (let i = 1; i <= 12; i++) {
    const salon = await api('/salons/create', 'POST', { name: `Salon Test ${i}` }, token);
    if (salon.status === 409) {
      throw new Error(`salón ${i} duplicado inesperado`);
    }
    const salonId = (salon.data as { salon: { id: string } }).salon.id;
    const visit = await api('/visits/create', 'POST', { document: '38214790', salonId }, token);
    const reg = visit.data as { totalVisits?: number; rewardGenerated?: boolean; message?: string };
    if (visit.status !== 201) throw new Error(`visita ${i} falló: ${visit.status}`);
    console.log(`visita ${i}: visitas=${reg.totalVisits} recompensa=${reg.rewardGenerated}`);
  }

  const lookup = await api('/loyalty/lookup/38214790');
  const data = lookup.data as { visits: number; rewardsAvailable: number };
  console.log('lookup Laura →', JSON.stringify(data));

  if (data.visits === 12 && data.rewardsAvailable === 1) {
    console.log('✓ FLUJO COMPLETO OK: 12 visitas → 1 recompensa DISPONIBLE');
  } else {
    console.error('✕ Resultado inesperado');
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
