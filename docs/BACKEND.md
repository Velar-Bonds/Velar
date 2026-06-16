# BACKEND.md : Estado y hoja de ruta del backend (apps/api)

> Documento vivo. Refleja el estado real del backend al revisar el código (no promesas).
> Dueño: agente de backend. El frontend NO edita esta carpeta : ver `docs/FRONTEND_GUIDE.md`.

## 0. Arquitectura (IMPORTANTE : leer primero)

**El bono ES un token real en Stellar (testnet).** No es un registro que "imita" un token.

- Cada bono = un **activo Stellar único** (cantidad 1, no divisible), emitido por la cuenta plataforma.
- **Tener el bono = tener ese activo** en la cuenta de custodia del dueño.
- **Transferir = mover el token**: dueño  a  cuenta de escrow (la "canasta")  a  nuevo dueño.
- **El escrow guarda el TOKEN**, no dinero. El pago es **físico/externo**; solo se registra el hash de su evidencia.
- La **propiedad y la historia viven en el ledger de Stellar** (verificable en stellar.expert).
- **Supabase = solo auth** (usuarios, roles, sesión) + índice de lectura para búsquedas rápidas.
  La fuente de verdad de la propiedad del bono es la blockchain, no Supabase.
- **Custodia asistida (demo):** el backend maneja las llaves (`.stellar-wallets.json`, gitignored)
  y firma las transacciones. El usuario no maneja wallets ni dinero.

Servicios clave: `StellarBondService` (emite/mueve/libera el token), `WalletService` (custodia/firma).
Para verlo funcionar: `docs/DEMO.md`  a  `npm run demo:flow`.

> **Trustless Work:** VELAR integra Trustless Work para crear contratos Soroban de escrow individuales
> por cada venta. El token del bono entra al contrato hasta que ambas partes confirman. Ver `TrustlessWorkService`.

---

## 1. Qué YA está hecho y funciona

El backend está **sorprendentemente completo**. NestJS con prefijo global `/api`, CORS,
`ValidationPipe`, auth por JWT de Supabase y service role para operar la base.

Módulos implementados:

| Módulo | Estado | Notas |
|---|---|---|
| `auth` (AuthGuard) | ✅ | Valida Bearer token de Supabase, carga `profile` con rol. |
| `users` | ✅ | getProfile, updateProfile, listUsers (admin/tse), setRole (admin). |
| `parties` | ✅ | Listar/crear partidos. Seed de 5 partidos en la migración. |
| `bonds` | ✅ | register, findAll (filtrado por rol), findOne, freeze/unfreeze (TSE). |
| `transfers` | ✅ | Flujo completo: request a accept a registerPayment a validate a release a cancel. |
| `escrow` | 🟡 | Cliente HTTP a Trustless Work. Init/fund/approve/release/refund. Ver §3. |
| `audit` | ✅ | emit() + consultas. Tabla append-only con trigger que bloquea UPDATE/DELETE. |
| `notifications` | ✅ | emit(userId, type, payload) + GET/PATCH. Notificaciones in-app por evento del ciclo de vida. |

Schema (`supabase/migrations/20260601000000_initial_schema.sql`): tablas `parties`,
`profiles`, `bonds`, `transfers`, `audit_events`; enums de estado; triggers de `updated_at`;
trigger de inmutabilidad de auditoría; trigger `handle_new_user`; índices; políticas RLS;
seed de partidos. **Sólido.**

Migración de notificaciones (`supabase/migrations/20260608000000_notifications.sql`): tabla `notifications` (`id`, `user_id` FK a `profiles` con `ON DELETE CASCADE`, `type`, `payload jsonb`, `read`, `created_at`), índices por usuario / fecha / no-leídas, y RLS que limita cada fila a su dueño (`user_id = auth.uid()`). El módulo `NotificationsModule` expone `emit()` y se inyecta en `TransfersService` y `BondsService`, que disparan notificaciones en: `offer_received`, `offer_accepted`, `offer_rejected`, `counter_offer_received`, `payment_confirmed`, `bond_approved`, `bond_rejected`.

### Endpoints actuales

```
GET    /api/users/me
PATCH  /api/users/me
GET    /api/users                 (admin/tse)
PATCH  /api/users/:id/role        (admin)

GET    /api/parties
GET    /api/parties/:id
POST   /api/parties

GET    /api/bonds
GET    /api/bonds/:tokenId
POST   /api/bonds                 (emisor/admin)
PATCH  /api/bonds/:tokenId/freeze     (tse/admin)
PATCH  /api/bonds/:tokenId/unfreeze   (tse/admin)

GET    /api/transfers
GET    /api/transfers/:id
POST   /api/transfers
PATCH  /api/transfers/:id/accept
PATCH  /api/transfers/:id/payment
PATCH  /api/transfers/:id/validate
PATCH  /api/transfers/:id/release
PATCH  /api/transfers/:id/cancel

GET    /api/audit/...             (timeline/eventos)

GET    /api/notifications                 (propias; { notifications, unreadCount })
PATCH  /api/notifications/read-all
PATCH  /api/notifications/:id/read
```

---

## 2. Bugs y deudas confirmados (orden de prioridad)

### 🔴 P0 : Bloquean que arranque o que funcione

1. **Crash al iniciar con Node 20** (`Node.js 20 detected without native WebSocket support`).
   El cliente de Supabase intenta abrir realtime. Arreglos posibles:
   - Subir a **Node 22+** (preferido), o
   - `npm i ws` y en `supabase.service.ts` hacer `globalThis.WebSocket ??= require('ws')`
     antes de `createClient`, o pasar opciones que desactiven realtime.

2. **21 archivos `.js` compilados dentro de `apps/api/src/`** (app.controller.js, etc.).
   Contaminan el repo y pueden cargarse en vez de los `.ts`. Hay que borrarlos y agregarlos
   a `.gitignore` (`apps/api/src/**/*.js`). Verificar que `tsconfig` emita a `dist/`.

3. **`SUPABASE_SERVICE_ROLE_KEY` no está en el repo** (correcto: es secreto). Quien clone debe
   pedirla al humano y ponerla en `apps/api/.env`. Sin ella el backend no opera la base.

4. **Confirmar que la migración fue aplicada** a la base de Supabase. Si no, aplicarla.

### 🟠 P1 : Seguridad y flujo

5. **Auto-asignación de rol en signup.** `handle_new_user()` lee `role` de
   `raw_user_meta_data`, así que un usuario puede registrarse como `admin/tse/validador`.
   **Fix:** forzar `comprador` por defecto e ignorar roles privilegiados enviados por el cliente;
   solo permitir `comprador`/`recomprador`/`emisor` (o solo `comprador`) en signup. Roles
   privilegiados se asignan vía `PATCH /api/users/:id/role` por un admin.

6. **Falta endpoint para listar destinatarios de transferencia.** Hoy `POST /api/transfers`
   exige el `toOwner` (UUID) a mano  a  fricción "comprador a recomprador". **Fix:** agregar
   `GET /api/users/recompradores` (o `GET /api/users/transferables`) que devuelva
   `{id, full_name, email, role}` de usuarios a los que se puede transferir, accesible a dueños.
   Esto desbloquea que el frontend use un `<select>` en vez de pedir UUIDs.

7. **Recursión potencial en RLS sobre `profiles`.** La policy `profiles_tse_admin` consulta
   `profiles` dentro de una policy ON `profiles`. Como el backend usa service_role (bypassa RLS)
   no se nota desde la API, pero **el frontend con acceso directo a Supabase puede romperse**
   con "infinite recursion detected". Reemplazar por función `SECURITY DEFINER` o claim de JWT.

### 🟡 P2 : Escrow real (ver §3) · datos demo · tests

8. **Escrow no es end-to-end** (detalle en §3).
9. **Sin datos demo** más allá de los partidos. Crear seed de usuarios (uno por rol),
   bonos y transferencias en distintos estados para que la demo cuente la historia.
10. **Tests y lint** sin revisar; probablemente quedan los specs por defecto de Nest.

---

## 3. Escrow / Trustless Work : qué falta para que sea real

Estado actual: `EscrowService` hace POST a `api.trustlesswork.com` y `initEscrow` devuelve un
`unsignedTransaction` (XDR de Stellar). **Nadie firma ni envía ese XDR**, y `fund`/`approve`
no se llaman en el flujo. Por eso hoy el escrow es "best-effort" (envuelto en try/catch).

Para que sea real end-to-end hace falta:
- **Dirección Stellar de la plataforma** (`TRUSTLESS_WORK_PLATFORM_ADDRESS`) : hoy vacía.
- **Wallets Stellar (testnet)** para vendedor, comprador y aprobador, con fondos de testnet.
- **Firma de XDR**: usar `@stellar/stellar-sdk` para firmar el `unsignedTransaction` con la
  clave del firmante y enviarlo a la red (o al endpoint `send-transaction` de Trustless Work).
- **Secuencia correcta**: initialize  a  (firmar/enviar)  a  fund  a  (firmar/enviar)  a  approve  a 
  release, mapeando cada paso al estado de la transferencia.
- **Decisión del humano:** ¿custodia asistida (el backend guarda/usa las claves de testnet) o
  el usuario firma desde su wallet? Para una demo, lo más simple es custodia asistida en testnet.

> Mientras no esté resuelto, el flujo de negocio funciona en la base (estados + auditoría) aunque
> el escrow on-chain quede simulado. Mantener ese degradado **explícitamente marcado**.

---

## 4. Hoja de ruta sugerida (backend)

1. P0: arreglar arranque (Node 22 o polyfill `ws`), borrar `.js` de `src`, confirmar migración.
2. P1: endpoint de destinatarios + cerrar signup de roles + arreglar recursión RLS.
3. P2: seed de datos demo (script idempotente) + smoke test del flujo completo vía API.
4. Escrow real en testnet (requiere insumos del humano, §3).
5. Limpiar/añadir tests y lint; documentar la API (este archivo + ejemplos de request/response).

## 5. Qué se necesita del humano

- [ ] `SUPABASE_SERVICE_ROLE_KEY` (Settings  a  API) para correr el backend.
- [ ] Confirmar Node 22+ disponible (o autorizar el polyfill `ws`).
- [ ] Para escrow real: dirección Stellar de plataforma + decisión de custodia + fondos testnet.
- [ ] Confirmar si la migración ya se aplicó a la base o si hay que aplicarla.
