# AGENTS.md — Plataforma de Fidelización Vitro

Guía para agentes de código que operen en este repositorio.

## Estado del proyecto

- Implementado: Fases 1–9 (scaffolding, BD+auth, clientes/salones, visitas+fidelización+recompensas, QR, dashboard, PWA, tests+docs). Ver `README.md` para puesta en marcha y API.
- `agends.md` es la **fuente de verdad** funcional y arquitectónica (1120 líneas). Cualquier duda de negocio o diseño debe resolverse contra ese documento, no inventando requisitos.
- **Alcance simplificado (decisión del usuario, prevalece sobre el spec):** un solo perfil de usuario (`SUPER_ADMIN`), sin cuentas para `ADMIN_SALON` ni `CLIENTE`. El cliente no se registra ni inicia sesión: existe una **página pública aparte** donde ingresa su número de documento y consulta cuántos sellos/visitas tiene (solo lectura, sin datos sensibles adicionales).
- Construir por fases (ver "Proceso" al final). No generar el sistema completo de una vez.

## Stack

**Frontend** (`/frontend`): Astro + React + TypeScript + Tailwind CSS + PWA (manifest, service worker, offline básico). Experiencia SPA: nada de recargas completas para operaciones normales.

**Backend** (`/backend`): Node.js + TypeScript + Express *o* Fastify + Prisma ORM + MySQL + JWT (access + refresh tokens) + bcrypt/argon2.

Ambos completamente separados; API en dominio propio (ej. `api.vitro.com` vs `vitro.com`).

## Comandos

> Verificados en Fase 1–9. Documentación completa en `README.md`.

```bash
# Desarrollo
backend:  npm run dev         # API :3000 (npx tsx watch)
frontend: npm run dev         # :4321 (usa "npx astro dev --background" / "stop" / "logs")

# Base de datos
cd backend && npx prisma migrate dev        # migraciones (desarrollo)
npx prisma migrate deploy                   # producción
npx tsx src/scripts/seedAdmin.ts            # SUPER_ADMIN inicial
npx prisma studio                           # explorar BD

# Tests (Vitest en ambos)
cd backend && npm run test                  # suite backend
cd backend && npx vitest run tests/api.test.ts      # test único (archivo)
cd backend && npx vitest run -t "jti"               # test único (nombre)
cd frontend && npm run test

# Typechecks (obligatorios antes de cerrar una fase)
cd backend && npm run typecheck             # tsc --noEmit
npx astro check                             # desde frontend/

# Build de producción
cd backend && npm run build && npm start
cd frontend && npm run build && node ./dist/server/entry.mjs
npm run icons                               # regenerar iconos PWA (sharp)
```

## Arquitectura (reglas estrictas)

- Flujo obligatorio en backend, **nunca lógica de negocio en las rutas**:
  `Route → Controller → Service → Repository/Prisma → MySQL`
- Estructura de carpetas (respetar el spec §2):
  - Frontend: `src/{components,layouts,pages,hooks,services,stores,types,utils,assets}`
  - Backend: `src/{controllers,services,repositories,routes,middlewares,validators,utils,types,config}`
- Roles: solo `SUPER_ADMIN` (alcance simplificado). Middleware de autenticación en todo endpoint administrativo; la consulta pública por documento es anónima y solo lectura.
- **Página pública de consulta:** el cliente ingresa su número de documento y ve sellos/visitas acumuladas y recompensas disponibles (solo lectura). Rate limiting + no exponer datos sensibles (sin teléfono, email ni historial completo).
- Relación usuarios–salones mediante tabla intermedia `user_salons` (no `salon_id` plano en el usuario).
- **Visitas: nunca eliminar físicamente.** Corrección = estado `ANULADA` + registro de quién la anuló (estados: `VALIDA`, `ANULADA`).
- **Recompensas no canjeables dos veces.** Estados: `DISPONIBLE`, `CANJEADA`, `ANULADA`.
- Regla de fidelización configurable (inicial: `12 visitas = 1 recompensa`), no hardcodear; tabla `loyalty_programs`.
- QR de salón con identificador seguro **no incremental** (ej. `/s/8Hd72Kp`).
- Acciones administrativas importantes → registrar en `audit_logs` (usuario, acción, entidad, fecha, metadata; sin datos sensibles). Ej: `REGISTERED_VISIT`, `REDEEMED_REWARD`.
- Preparado para crecer (puntos, campañas, múltiples programas) sin sobreingenierizar la v1.

## Estilo de código

- **TypeScript estricto**, sin `any` implícito. Tipos definidos en `types/` del módulo correspondiente.
- Nombres: código en inglés descriptivo (camelCase para variables/funciones, PascalCase para componentes/clases); datos de dominio visualizados al usuario en español (ej. "Te faltan 4 visitas").
- SOLID + DRY: no duplicar lógica ni código entre páginas; DTOs cuando aplique.
- Prohibido: archivos gigantes, toda la lógica en un solo componente, lógica duplicada.
- Componentes reutilizables obligatorios del spec §19 (Button, Input, Modal, Card, Toast, Loading, EmptyState, ConfirmDialog, QRScanner, LoyaltyCard, RewardCard, StatsCard, etc.). Reutilizar antes de crear nuevos.
- Todo componente que consuma API debe manejar estados: `loading`, `success`, `error`, `empty` (+ `unauthorized`, `forbidden` donde aplique). Feedback visual en toda acción ("Registrando visita... ✓ Visita registrada").
- Mensajes de error amigables para el usuario; nunca exponer errores técnicos crudos al cliente.
- Manejo de errores centralizado en backend (middleware), validación de inputs con librería de validators específica por endpoint. En la consulta pública, documento no encontrado → mensaje neutro (no revelar existencia/inescritos).

## Seguridad (obligatorio)

- Contraseñas con bcrypt/argon2, **jamás texto plano**.
- JWT + refresh tokens; preferir cookies `HttpOnly`/`Secure` para refresh tokens. No almacenar tokens sensibles en `localStorage`.
- CORS configurado explícitamente entre frontend y API; rate limiting; headers de seguridad.
- Validación + sanitización en todos los inputs; Prisma protege contra SQL injection (no concatenar SQL).
- Secretos solo en variables de entorno: mantener `.env.example` versionado, **nunca subir `.env`**.
- Registrar visitas: solo desde el panel admin (autenticado), validando salón válido y activo, cliente válido, duplicidad y estado.

## Diseño / UX

- **Todo con Tailwind CSS.** Sin CSS inline ni frameworks adicionales.
- Estética: cálida, elegante, premium — bordes redondeados, cards, sombras suaves, espacios amplios, tipografía elegante, transiciones suaves. **Sin** colores saturados ni apariencia corporativa/tecnológica.
- **Mobile-first**: botones grandes, navegación simple, formularios cortos. Dashboard admin también responsive.
- Crear sistema de diseño con variables/clases reutilizables (colores, tipografía, botones, cards, inputs, estados).
- Rutas: panel admin bajo `/admin/*` protegido por auth; página de consulta pública en `/consulta` (o ruta equivalente), anónima y solo lectura.

## Proceso de desarrollo

- Trabajar por fases (spec §30): 1 estructura → 2 BD + auth → 3 clientes/salones → 4 fidelización/visitas → 5 recompensas → 6 QR → 7 dashboards → 8 PWA → 9 pruebas/documentación.
- Antes de escribir código en una fase importante: analizar requerimientos, proponer arquitectura y modelo entidad-relación, mostrar tablas/relaciones y explicar flujos (auth, visitas, recompensas). **Esperar confirmación del usuario.**
- No inventar funcionalidades no solicitadas. En decisiones técnicas importantes, explicar brevemente alternativas y recomendar una sin ampliar el alcance.
- Código funcional y listo para producción.

## Entidad de referencia (flujo núcleo — versión simplificada)

`SUPER_ADMIN registra visita desde panel → cliente consulta su progreso en página pública con su documento → 12 visitas → recompensa DISPONIBLE → canje validado por SUPER_ADMIN → CANJEADA`
