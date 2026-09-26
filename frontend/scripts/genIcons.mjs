/**
 * Genera los iconos PWA a partir de un SVG de marca (evita assets binarios en el repo).
 * Uso: node scripts/genIcons.mjs
 */
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#faf6f0"/>
      <stop offset="1" stop-color="#eadfcc"/>
    </linearGradient>
    <linearGradient id="v" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#cfa96b"/>
      <stop offset="1" stop-color="#b87480"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="108" fill="url(#bg)"/>
  <circle cx="256" cy="238" r="150" fill="none" stroke="#cfa96b" stroke-opacity="0.5" stroke-width="3"/>
  <path d="M166 168 L236 168 L256 262 L276 168 L346 168 L286 352 L226 352 Z" fill="url(#v)"/>
  <text x="256" y="418" font-family="Georgia, serif" font-size="64" letter-spacing="18" text-anchor="middle" fill="#2b2019">VITRO</text>
</svg>`;

async function render(size, out, maskable = false) {
  const pad = maskable ? Math.round(size * 0.06) : 0;
  await sharp(Buffer.from(svg))
    .resize(size - pad, size - pad)
    .extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: 250, g: 246, b: 240, alpha: 1 } })
    .png()
    .toFile(join(root, 'public', out));
  console.log('icono generado:', out);
}

await mkdir(join(root, 'public'), { recursive: true });
await render(192, 'icon-192.png');
await render(512, 'icon-512.png');
await render(300, 'icon-maskable.png', true);
await sharp(Buffer.from(svg)).resize(64, 64).png().toFile(join(root, 'src', 'favicon.png'));
console.log('favicon.png generado');
