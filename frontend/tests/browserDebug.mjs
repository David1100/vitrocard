/**
 * Diagnóstico real del panel con Chromium headless:
 * inicia sesión, entra a /admin/clientes y captura consola + red + estado del DOM.
 * Uso: node tests/browserDebug.mjs <url_frontend>
 */
import { chromium } from 'playwright';

const FRONT = process.argv[2] ?? 'http://localhost:4321';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

const logs = [];
page.on('console', (msg) => logs.push(`[console.${msg.type()}] ${msg.text()}`));
page.on('pageerror', (err) => logs.push(`[pageerror] ${err.message}`));
page.on('requestfailed', (req) => logs.push(`[requestFAILED] ${req.method()} ${req.url()} :: ${req.failure()?.errorText}`));
page.on('response', (res) => {
  if (res.url().includes(':3000') || res.url().includes('/api')) {
    logs.push(`[response] ${res.status()} ${res.url()}`);
  }
});

// 1. Login
await page.goto(`${FRONT}/admin/login`, { waitUntil: 'networkidle' });
await page.fill('input[type="email"]', 'admin@vitro.com');
await page.fill('input[type="password"]', 'VitroAdmin2026!');
await page.click('button[type="submit"]');
await page.waitForURL('**/admin/clientes', { timeout: 10000 }).catch(() => logs.push('[NAV] no navegó a clientes'));

// 2. Esperar que el listado cargue
await page.waitForTimeout(4000);
const tableRows = await page.locator('tbody tr').count();
const hasSkeleton = (await page.locator('.animate-pulse').count()) > 0;
const emptyState = await page.locator('text=Aún no hay clientes').count();
const bannerError = await page.locator('[role="alert"]').first().textContent().catch(() => null);

console.log('=== RESULTADO ===');
console.log('URL final:', page.url());
console.log('Filas en la tabla:', tableRows);
console.log('EmptyState visible:', emptyState);
console.log('Error banner:', bannerError);
console.log('=== CONSOLA DEL NAVEGADOR ===');
logs.forEach((l) => console.log(l));

await page.screenshot({ path: 'tests/browsershot.png', fullPage: true });
await browser.close();
