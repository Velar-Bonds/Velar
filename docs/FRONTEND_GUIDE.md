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
- **Rutas normales** (NO `/dashboard/*`). El middleware `middleware.ts` protege `/marketplace`, `/partido`, `/tse`, `/admin`.
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

### Auditoría (TSE y trazabilidad para todos los roles)

Endpoints bajo `/audit/...`:

| Endpoint | Auth | Propósito |
|----------|------|-----------|
| `GET /audit/bonds` | TSE/Admin | Buscar bonos con filtros |
| `GET /audit/bonds/:tokenId/timeline` | TSE/Admin | Línea de tiempo (bond + events + transfers con perfiles) |
| `GET /audit/bonds/:tokenId/traceability` | **Todos los roles** | Trazabilidad consolidada (bond, events, transfers sin perfiles, owners[] derivado) |
| `GET /audit/events` | TSE/Admin | Eventos de auditoría recientes |

#### Trazabilidad (nuevo): `GET /audit/bonds/:tokenId/traceability`

Endpoint canónico para la página de trazabilidad. Reemplaza el patrón anterior de dos fetch paralelos (`/bonds` + `/transfers`) con derivación manual de owners.

**Características clave:**
- Accesible a **todos los roles autenticados** (no requiere TSE/admin)
- La respuesta usa el contrato compartido `TraceabilityResponse` (`BondToken`, `AuditEvent`, `Transfer`, `OwnerEntry`) en camelCase
- Las transfers NO incluyen `from_profile` / `to_profile` (usa solo UUIDs)
- Los owners vienen derivados del servidor como `owners[]`, con `current: true` en el último
- `paid: true` solo en transfers con status `liberada`
- 404 para tokenId desconocido

**Uso recomendado:**
```typescript
// Reemplaza 2 fetch paralelos:
//   apiFetch(token, 'GET', '/bonds?page=1&limit=100')     → sidebar (se mantiene)
//   apiFetch(token, 'GET', '/transfers?page=1&limit=100')  → deprecated for traceability

// Por un solo fetch:
const trace = await apiFetch(token, 'GET', `/audit/bonds/${sel}/traceability`);
const owners = trace.owners;   // cadena de propietarios lista para renderizar
const current = owners.find(o => o.current); // dueño actual
```

**Sidebar:** La lista de bonos en la barra lateral se mantiene como un fetch separado a `/bonds?page=1&limit=100`. Una futura optimización podría cachear la lista o exponer un endpoint `/bonds/summary` para sidebar, pero está fuera del alcance actual.

> ⚠️ Antes de implementar, confirmá los nombres exactos de campos contra `packages/types`
> (`BondToken`, `Transfer`, `AuditEvent`, `Role`, `BondStatus`, `TransferStatus`, `OwnerEntry`, `TraceabilityResponse`). Son la fuente
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

---

## 10. Cliente tipado, schemas de formulario y errores (issue #43)

No declares a mano el tipo de un endpoint cubierto. Usá el registro `apiContracts` de
`@velar/types` mediante `typedApi`:

```typescript
const report = await typedApi.call(
  'reports.create',
  { body: { title, description, period_start, period_end } },
  token,
);
```

El nombre del contrato determina el tipo de `body`, `params`, `query` y respuesta. El cliente de
`apps/web/lib/contract-client.ts` valida inputs antes de hacer `fetch`, valida la respuesta en
runtime y lanza `ContractApiError` con `code`, `status`, `fields` y `details`. `apiFetch` también
pasa automáticamente por esta capa para que las pantallas existentes obtengan validación runtime.

Para formularios, importá el mismo schema del endpoint y el mapper reutilizable:

```typescript
const validation = validateSchemaForm(createTransferRequestSchema, values, 'es');
if (!validation.success) {
  setFieldErrors(validation.errors);
  return;
}
await typedApi.call('transfers.create', { body: validation.data }, token);
```

`SchemaFieldError` y `schemaFieldProps` agregan mensaje inline, `role="alert"`,
`aria-invalid` y `aria-describedby`. Signup, emisión/solicitud de bonos, ofertas de transferencia
y creación/revisión de reportes ya usan este patrón. Los mensajes salen del catálogo compartido
español/inglés, no de strings duplicados en cada formulario.

### Comprobación local sin credenciales

```bash
npm run build --workspace @velar/types
npm run typecheck --workspace apps/web
npm run lint --workspace apps/web
npm run test --workspace apps/web
npm run build --workspace apps/web
```

Las pruebas del cliente usan `fetch` simulado y las pruebas de formularios son puras; ninguna
requiere Supabase, VELAR DB, wallets ni proveedores externos.

## 11. Lector de contratos (issue #39)

Experiencia de lectura y comprensión del contrato de un bono en lenguaje simple. **Complementa el
contrato legal; no lo reemplaza.** Consume los endpoints públicos del backend
(`GET /contracts/:bondId/reader`, `GET /contracts/glossary`).

### Componentes

- `components/contract-reader/ContractReader.tsx` — el lector: resumen arriba, vista
  cláusula-por-cláusula en lenguaje simple, tooltips de glosario sobre términos resaltados,
  toggle **Lenguaje simple ⇄ Documento legal**, barra de progreso de lectura, checkpoints de
  comprensión ("¿Entendiste esta cláusula?") e **imprimir / exportar**. Localizado (es),
  responsive y accesible (navegación por teclado entre cláusulas con flechas, `aria`, foco visible,
  definiciones para lector de pantalla, `motion-reduce`). Maneja loading / error / vacío.
  - Props: `bondId` (requerido), `locale?` (`'es' | 'en'`), `initialReader?` (para fixtures/SSR).
- `components/contract-reader/ContractReaderDialog.tsx` — modal accesible que monta el lector bajo
  demanda (usado en las listas de bonos).

### Helpers puros (`lib/contract-reader.ts`)

`createContractReaderClient({ baseUrl, fetch })`, `highlightSegments`, `computeReadingProgress`,
`plainLanguageText`, `buildExportText`, `glossaryById`. Testeados en `lib/contract-reader.spec.ts`.

### Dónde está integrado

- `app/mis-bonos/` y `app/partido/mis-bonos/` — botón **Contrato** por bono → abre el modal.
- `app/tse/bono/[tokenId]/` — lector embebido en el detalle del bono.
- `app/verificar/[id]/` (público) — lector embebido bajo la trazabilidad.

> Nota: el contrato estructurado proviene de un fixture hasta que aterrice el epic #38 (Contract
> intelligence & assembly); el backend inyecta el `bondId` solicitado.
## 12. Reporte mensual del partido (issue #40)

Pantallas en `apps/web/app/partido/reportes/` (rol `emisor`). Helpers de UI en
`lib/reports.ts` (etiquetas de estado/categoría/cumplimiento, formato CRC/fecha,
espejo cliente del cálculo de vencimiento y `uploadReportFile` multipart).

### Builder multi-paso — `reportes/nuevo`
Cinco pasos: **Período → Líneas → Archivos → Conciliación → Revisar**.
- Al pasar de "Período" se crea el borrador (`POST /reports/lifecycle`).
- Líneas: alta/baja con total corriente y selector de bono declarado
  (`POST`/`DELETE /reports/lifecycle/:id/line-items`).
- Archivos: subida multipart (`uploadReportFile`); el backend valida tipo/tamaño,
  calcula checksum y pasa el antivirus antes de guardar.
- Conciliación: preview de discrepancias (`GET /reports/lifecycle/:id/reconciliation`)
  antes de enviar. Se puede enviar con discrepancias; el TSE las verá.
- Revisar → `POST /reports/lifecycle/:id/submit` y redirige al detalle.

### Detalle e historial — `reportes/[id]`
`GET /reports/lifecycle/:id` (líneas, archivos, versiones, conciliación).
- Badge de estado + badge de cumplimiento (vence el 15 del mes siguiente, 5 días
  de gracia; espejo de la lógica pura del backend).
- **Timeline de versiones**: cada envío con su estado, fecha, total y resultado de
  conciliación (los snapshots son inmutables).
- **Corrección guiada**: si el estado es `observado`, se muestra la observación del
  TSE, se pueden agregar líneas y **reenviar** (nueva versión, conserva historial).

### Listado — `reportes`
CTA hacia el builder estructurado, badges de cumplimiento por período y tarjetas
que enlazan al detalle. Convive con el formulario legacy de reporte de texto libre.

### Estados a manejar
Localizado (es), responsive y accesible; con estados de carga, vacío y error en cada
pantalla. Nunca se usa `service_role` ni secretos en el cliente.

## 13. Explorador de procedencia y trazabilidad (issue #36)

Explora la **historia verificada** de un bono: cadena de propiedad, ciclo de vida de
cada transferencia y reporte de integridad. La bitácora se muestra en orden y **nunca
se reordena ni se muta** en la UI.

### Helpers puros — `lib/provenance.ts`
Cliente tipado + helpers sin framework (testeables en node):
`createProvenanceClient` (`getBondProvenance` autenticado / `getPublicBondProvenance`
público), `provenanceSummary`, `sortAnomalies` / `anomalyLabel`, `ownershipDurationLabel`,
`stepStates` / `abortedStage`, `statusLabel`, `buildProvenanceCsv` y
`buildProvenanceExportText`.

### Componentes — `components/provenance/`
- **`OwnershipTimeline`** — cadena de dueños (emisor → dueño actual) con el período
  que cada uno lo tuvo.
- **`TransferLifecycleStepper`** — los seis pasos (`solicitada → aceptada → en_escrow →
  pago_registrado → pago_validado → liberada`); `rechazada`/`cancelada` marcan los
  pasos no alcanzados como abortados.
- **`ProvenanceExplorer`** — compone lo anterior + reporte de integridad, chips de
  resumen, inspector de eventos con filtro por tipo, links on-chain (Stellar Expert),
  diff de dueño por transferencia y export **CSV / imprimir (PDF)**. Estados de
  carga/vacío/error incluidos.
- **`ProvenanceDialog`** — modal accesible que hospeda el explorer (Escape / click
  fuera, foco al abrir, bloquea scroll).

### Integración (6 superficies)
Botón "Procedencia verificada" (autenticado) en `trazabilidad/`, `tse/trazabilidad/`,
`partido/trazabilidad/`, y "Procedencia" por transferencia en `negociaciones/` y
`partido/negociaciones/`. En la verificación pública `verificar/[id]/` el explorer va
embebido en modo público. Los componentes son presentacionales (reciben datos del
motor); el fetch vive en `ProvenanceExplorer`. Nunca se usa `service_role` ni secretos
en el cliente.
