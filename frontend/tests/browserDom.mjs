import { chromium } from 'playwright';

const FRONT = 'http://localhost:4321';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

const logs = [];
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));

await page.goto(`${FRONT}/admin/login`);
await page.fill('input[type="email"]', 'admin@vitro.com');
await page.fill('input[type="password"]', 'VitroAdmin2026!');
await page.click('button[type="submit"]');
await page.waitForURL('**/admin/clientes', { timeout: 10000 }).catch(() => {});
await page.waitForTimeout(5000);

// ¿Qué hay realmente en el DOM?
const islandChildren = await page.evaluate(() => {
  const island = document.querySelector('astro-island');
  if (!island) return 'NO HAY astro-island';
  return {
    client: island.getAttribute('client'),
    componentUrl: island.getAttribute('component-url'),
    hasChildren: island.innerHTML.length > 100,
    text: island.textContent?.slice(0, 120),
  };
});
console.log('=== ISLAND ===');
console.log(JSON.stringify(islandChildren, null, 2));
console.log('=== BODY TEXT (recorte) ===');
const bodyText = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 400));
console.log(bodyText);
console.log('=== CONSOLA ===');
logs.forEach((l) => console.log(l));
await browser.close();
