# FRONTEND_GUIDE.md : Guía para el agente/dev de Frontend (apps/web)

> Para quien construye el frontend de VELAR. **Leé también `AGENTS.md`** (reglas del repo).
> El backend ya está hecho y es la fuente de verdad de la lógica y los permisos. Tu trabajo es
> consumir la API y presentar bien la información. **No toques `apps/api`, `supabase/` ni la
> lógica de `packages/types`.**

> 🔗 **Importante:** el bono es un **token real en Stellar**. La propiedad y la historia viven
> en la blockchain. Mostrá el dueño on-chain y un link al explorador (usá `GET /bonds/:id/onchain`).
> Supabase es solo para login. Para entender el flujo, mirá `docs/DEMO.md`.

> 🚫 **Para NO romper el backend (regla dura):** trabajá **solo en `apps/web/`**.
> NO edites `apps/api/`, `supabase/migrations/`, ni los `.ts` de `packages/types/` (podés
> importar sus tipos, no cambiarlos). NO toques los `.env`. NO cambies los contratos de la API:
> si necesitás un endpoint o campo nuevo, anotalo acá y avisá : no lo "arregles" en el backend.
> Antes de commitear: `npm run build --workspace apps/web` debe pasar.

---

## 0. Estado actual del frontend (qué ya existe)

Páginas ya construidas en `apps/web/app/` (Next.js App Router, Tailwind v4, lucide-react):

| Ruta | Archivo | Qué es |
|---|---|---|
| `/` | `app/page.tsx` | Landing pública |
| `/login` | `app/login/` (page + `LoginPageClient`) | Login (Supabase) |
| `/signup` | `app/signup/` (page + `SignUpPageClient`) | Registro (POST `/api/auth/register`) |
| `/marketplace` | `app/marketplace/page.tsx` | Marketplace del comprador (vitrina + comprar) |
| `/partido` | `app/partido/page.tsx` | Panel del Partido (aceptar ventas, confirmar pago) |
| `/tse` | `app/tse/` (page + `TSEPageClient`) | Panel del TSE (ve todo) |

Convenciones del proyecto (seguilas):
- **Rutas normales** (NO `/dashboard/*`). El middleware `proxy.ts` protege `/marketplace`, `/partido`, `/tse`, `/admin`.
- **Patrón page + Client**: `page.tsx` exporta `metadata` y renderiza un `XPageClient` (`'use client'`).
- **Tokens de diseño** en `app/globals.css` (`@theme`): usá clases como `text-primary`, `bg-surface-container`, `glass-card`, etc. No hardcodees hex si hay token.
- **Íconos**: `lucide-react` o Material Symbols (clase `material-symbols-outlined`).
- **Auth**: `lib/supabase/client.ts` (browser). Para llamar la API, mandá `Authorization: Bearer <access_token>`.
- **Imágenes** en `apps/web/public/`.

## 1. Tu alcance

- Sí: `apps/web/**` (Next.js App Router + Tailwind). Pantallas, componentes, llamadas a la API.
- Sí: leer tipos desde `@velar/types` (importá, no redefinas).
- No: backend, migraciones SQL, ni cambiar contratos de la API sin acuerdo.

## 2. Stack del frontend

- **Next.js (App Router)** + TypeScript + Tailwind.
- **Supabase Auth** en el cliente (login/signup, manejo de sesión).
- Llamadas al backend NestJS por HTTP con el **access token** de Supabase en el header.

Variables de entorno (`apps/web/.env.local`, pedí los valores al humano):
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...   # anon/publishable. NUNCA el service_role.
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## 3. Cómo autenticar cada request (patrón obligatorio)

1. Login/signup con Supabase Auth  a  obtenés una `session` con `access_token`.
2. En **cada** llamada al backend, mandá el header:
   ```
   Authorization: Bearer <access_token>
   ```
3. El backend valida el token, identifica al usuario y su **rol**, y aplica permisos.
   Vos NO decidís permisos en el front: mostrás/ocultás UI por conveniencia, pero la verdad
   la pone el backend (puede devolver 401/403).

Hay helpers en `apps/web/lib/supabase/` y `apps/web/lib/api/`. Reutilizalos; no crees clientes
nuevos en paralelo.

## 4. Contrato de la API (base: `NEXT_PUBLIC_API_URL`)

> Todos requieren `Authorization: Bearer <token>` salvo que se indique. Prefijo: `/api`.

### Perspectivas (3)
- **TSE** (rol `tse`): emite bonos a nombre de un partido; ve todo; puede congelar.
- **Partido** (rol `emisor`): recibe sus bonos y los vende (acepta solicitudes, confirma pago).
- **Usuario** (rol `comprador`/`recomprador`, son lo mismo): compra y revende bonos.

### Registro (público, sin token)
- `POST /auth/register` con body:
  - Usuario: `{ email, password, perspectiva: "usuario", nombres, apellidos, identificacion, telefono, direccion }`
  - Partido: `{ email, password, perspectiva: "partido", nombrePartido, codigo, representanteLegal, cedulaJuridica }`
  - Crea la cuenta + perfil con la info + una wallet de custodia. (El TSE se siembra, no se auto-registra.)

### Usuarios
- `GET  /users/me`  a  perfil del usuario actual (incluye `role`, `party_id`, `stellar_wallet`).
- `PATCH /users/me`  a  body `{ full_name?, stellar_wallet? }`.
- `GET  /users`  a  lista usuarios (solo admin/tse).
- `PATCH /users/:id/role`  a  body `{ role }` (solo admin).

### Partidos
- `GET  /parties`  a  lista de partidos (para `<select>`).
- `GET  /parties/:id`
- `POST /parties`  a  `{ code, name }`.

### Bonos
- `GET  /bonds`  a  bonos visibles según el rol (dueño ve los suyos; emisor los de su partido;
  TSE/admin ven todos). Incluye `parties` y datos del dueño.
- `GET  /bonds/:tokenId`  a  detalle de un bono.
- `GET  /bonds/:tokenId/onchain`  a  info blockchain: `{ assetCode, onchainHolder, assetExplorer }`.
  Mostrá `assetExplorer` como link a Stellar (stellar.expert) y `onchainHolder` como dueño real on-chain.
- `POST /bonds` (emisor/admin)  a  `{ bondId, issuerPartyId, documentHash, metadataUri?,
  faceValue?, initialOwner? }`.
- `PATCH /bonds/:tokenId/freeze` (tse/admin)  a  congela.
- `PATCH /bonds/:tokenId/unfreeze` (tse/admin)  a  reactiva.

### Bonos en venta (vitrina)
- `GET /bonds/available`  a  bonos `activo` de OTROS dueños, que un usuario puede solicitar comprar.

### Transferencias (flujo principal) : el COMPRADOR inicia
- `GET   /transfers`  a  transferencias donde sos vendedor o comprador.
- `GET   /transfers/:id`  a  detalle (con bono y perfiles).
- `POST  /transfers`  a  `{ bondTokenId, amount? }`. **El comprador solicita comprar** ese bono
  (el vendedor = dueño actual se resuelve solo). Estado `solicitada`.
- `PATCH /transfers/:id/accept`  a  **el dueño/vendedor acepta** la venta; el token va a la canasta (escrow).
- `PATCH /transfers/:id/payment`  a  `{ evidence }`; **el comprador** registra el pago físico (se guarda su hash).
- `PATCH /transfers/:id/release`  a  **el vendedor confirma el pago** y libera el token al comprador.
- `PATCH /transfers/:id/cancel`  a  cancela (el token vuelve al dueño anterior).

> Nota: ya no hay rol "validador" en el flujo; el propio vendedor confirma el pago recibido.

### Auditoría (TSE)
- Endpoints bajo `/audit/...` para timeline y eventos de un bono. Ver `audit.controller.ts`
  para las rutas exactas y úsalos para el panel del TSE (búsqueda + línea de tiempo).

> ⚠️ Antes de implementar, confirmá los nombres exactos de campos contra `packages/types`
> (`BondToken`, `Transfer`, `AuditEvent`, `Role`, `BondStatus`, `TransferStatus`). Son la fuente
> de verdad de los enums y formas de datos.

## 5. UX que el backend espera / facilita

- **No pidas UUIDs a mano.** Para elegir destinatario de una transferencia, usá el endpoint de
  listado de usuarios/destinatarios (si aún no existe, está en la hoja de ruta del backend:
  `GET /users/recompradores`). Mientras tanto, no bloquees: dejá el campo preparado para un select.
- Para elegir **partido** al emitir un bono, usá `GET /parties` en un `<select>`.
- El **hash del documento** lo calcula el backend a partir del contenido/evidencia que mandes.
  No intentes replicar el hashing en el front salvo para mostrar.

## 6. Pantallas por rol (ya existen, pulilas : no las reinventes)

`apps/web/app/dashboard/{emisor,comprador,recomprador,validador,tse,admin}/page.tsx`
- **emisor:** registrar bono (select de partido) + ver bonos de su partido.
- **comprador / recomprador:** ver mis bonos; iniciar/recibir transferencias; registrar pago.
- **validador:** ver transferencias en `pago_registrado`; validar y liberar.
- **tse:** búsqueda (por tokenId, bondId, partido, dueño, estado), timeline de un bono,
  congelar/descongelar. Es la pantalla estrella para la demo de trazabilidad.
- **admin:** gestión de usuarios y roles.

## 7. Errores y estados a manejar

- `401`  a  token vencido/ausente: redirigí a login y refrescá sesión.
- `403`  a  el rol no tiene permiso: mostrá mensaje claro, no rompas la UI.
- `400`  a  reglas de negocio (ej. "Bond status no permite transferir"): mostrá el `message`.
- Estados de bono/transfer: mostralos con colores/badges claros usando los enums de `@velar/types`.

## 8. Definición de "terminado" (frontend)

- [ ] `npm run build --workspace apps/web` pasa.
- [ ] `npm run lint` sin errores nuevos.
- [ ] Login real funciona y el token llega en cada request.
- [ ] Cada pantalla maneja loading / error / vacío.
- [ ] No se usó el `service_role` key ni se hardcodeó ningún secreto.
- [ ] No se modificó `apps/api`, `supabase/` ni los contratos de la API.

## 9. Si algo de la API no te cuadra

No cambies el backend por tu cuenta. Anotá lo que necesitás (campo faltante, endpoint nuevo,
forma distinta) en este archivo o en `docs/BACKEND.md` y avisá al humano / agente de backend.
