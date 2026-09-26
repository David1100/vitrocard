import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();

const logs = [];
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));

await page.goto('http://localhost:4321/consulta', { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);

const input = await page.$eval('#doc', (el) => {
  const cs = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  return { display: cs.display, visibility: cs.visibility, opacity: cs.opacity, w: r.width, h: r.height };
}).catch((e) => `NO INPUT: ${e.message}`);

const btn = await page.$eval('button[type="submit"]', (el) => {
  const cs = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  return { display: cs.display, visibility: cs.visibility, opacity: cs.opacity, w: r.width, h: r.height };
}).catch((e) => `NO BUTTON: ${e.message}`);

console.log('INPUT:', JSON.stringify(input));
console.log('BUTTON:', JSON.stringify(btn));
console.log('--- console ---');
logs.forEach((l) => console.log(l));

await browser.close();
