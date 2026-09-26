# Vitro — Plataforma de Fidelización

Tarjeta digital de fidelización (PWA) para los Hair Salón del grupo **Vitro**.

**Alcance actual:** un solo perfil administrativo (`SUPER_ADMIN`) + página pública donde el cliente consulta sus sellos/visitas con su número de documento (sin cuentas de cliente).

> Documento de especificación completo: [`agends.md`](./agends.md). Guía para agentes: [`AGENTS.md`](./AGENTS.md).

---

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Astro + React + TypeScript + Tailwind CSS + PWA |
| Backend | Node.js + Express 5 + TypeScript + Prisma ORM |
| Base de datos | MySQL 8 |
| Auth | JWT (access 15 min) + refresh token rotativo en cookie HttpOnly |
| Tests | Vitest (backend + frontend) |

## Estructura

```
frontend/   # Astro (páginas prerenderizadas) + React islands para interactividad
backend/    # API REST: Route → Controller → Service → Repository → Prisma → MySQL
```

## Requisitos

- Node.js ≥ 20
- MySQL corriendo localmente (o remota; ver `.env`)

## Puesta en marcha

### 1. Base de datos

```bash
cd backend
cp .env.example .env        # ajusta DATABASE_URL y secretos JWT
npx prisma migrate dev      # crea/actualiza el esquema
npx tsx src/scripts/seedAdmin.ts   # crea el SUPER_ADMIN inicial
```

Credenciales iniciales (dev): `admin@vitro.com` / `VitroAdmin2026!`

### 2. Backend

```bash
cd backend
npm run dev        # http://localhost:3000 (healthcheck en /api/health)
```

### 3. Frontend

```bash
cd frontend
npm run dev        # http://localhost:4321
```

`PUBLIC_API_URL` en el `.env` del frontend define dónde apunta la API (por defecto `http://localhost:3000/api`).

> El backend acepta orígenes en `CORS_ORIGIN` (separados por coma). En desarrollo, cualquier orígen `localhost`/`127.0.0.1` se permite automáticamente para comodidad del uso local.

## Comandos útiles

```bash
# Backend
npm run dev | build | start | typecheck | test
npx vitest run tests/api.test.ts          # test único (archivo)
npx vitest run -t "jti"                   # test único (nombre)
npx prisma migrate dev / studio

# Frontend
npm run dev | build | preview | check | test
npm run icons                             # regenerar iconos PWA con sharp
```

## Rutas principales

### Públicas
- `/consulta` — cliente ingresa su documento y ve sellos/visitas y recompensas disponibles (solo lectura)
- `/s/:code` — landing al escanear el QR de un salón

### Panel admin (JWT)
- `/admin/login`, `/admin` (dashboard), `/admin/clientes`, `/admin/salones`, `/admin/visitas`, `/admin/recompensas`, `/admin/configuracion`

### API (extracto)
```
POST /api/auth/login | refresh | logout      GET /api/auth/me
GET/POST /api/customers         PUT/PATCH /api/customers/:id
GET/POST /api/salons            GET /api/salons/qr/:code (público)
GET/POST /api/visits            PATCH /api/visits/:id/cancel
GET    /api/rewards/customer/:document          POST /api/rewards/:id/redeem
GET/PATCH /api/loyalty/config   GET /api/loyalty/lookup/:document (público)
GET    /api/dashboard/stats
```

## Reglas de negocio implementadas

- **Un perfil**: solo `SUPER_ADMIN`; los clientes no inician sesión.
- **Visitas**: duplicidad por cliente+salón+día protegida (409); corrección = estado `ANULADA` con registro de quién anuló; nunca eliminación física.
- **Recompensas**: se generan automáticamente al completar la regla del programa (por defecto 12 visitas) en la misma transacción de la visita; el canje es único (`DISPONIBLE → CANJEADA` con quién/dónde/cuándo; segundo intento → 409).
- **Regla configurable**: tabla `loyalty_programs`, editable desde `/admin/configuracion`; sincroniza la recompensa asociada.
- **Auditoría**: `audit_logs` registra acciones admin (visitas, anulaciones, canjes, altas).
- **Consulta pública**: anónima, rate-limitada (30/min), solo sellos/visitas — sin datos sensibles; documento inexistente → mensaje neutro.

## Seguridad

- Contraseñas con bcrypt (12 rounds); refresh tokens almacenados solo como SHA-256.
- Access token en memoria del navegador (nunca localStorage); refresh en cookie `HttpOnly`, `SameSite=Strict`, *path* `/api/auth`.
- Rate limiting global (120/min) + estricto en `login` (10/10min) y `lookup` público (30/min).
- Helmet, CORS explícito, validación/sanitización Zod en todo endpoint, manejo de errores centralizado (nunca detalles técnicos al cliente).
- Secretos solo en `.env` (versionado el `.env.example`).

## Despliegue

- Backend: `npm run build` + `npm start` (requiere `NODE_ENV=production`, HTTPS a cargo del proxy).
- Frontend: `npm run build` (estático) + `node ./dist/server/entry.mjs` (adaptador Node solo para `/s/[code]`).
- PWA: manifest + service worker con estrategia cache-first (estáticos) / network-first (navegación).
