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
| `users` | ✅ | Directorio paginado/buscable, roles individuales o masivos, ciclo de cuenta y auditoría por usuario. |
| `parties` | ✅ | Listar/crear partidos. Seed de 5 partidos en la migración. |
| `bonds` | ✅ | register, findAll (filtrado por rol), findOne, freeze/unfreeze (TSE). |
| `transfers` | ✅ | Flujo completo: request a accept a registerPayment a validate a release a cancel. |
| `escrow` | 🟡 | Cliente HTTP a Trustless Work. Init/fund/approve/release/refund. Ver §3. |
| `audit` | ✅ | emit() + consultas. Tabla append-only con trigger que bloquea UPDATE/DELETE. Incluye `GET /audit/bonds/:tokenId/traceability` (todos los roles, sin restricción TSE). |
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
GET    /api/users                 (admin/tse; incluye stellar_wallet_status + stellar_wallet_error)
PATCH  /api/users/:id/role        (admin)
POST   /api/users/bulk-role       (admin; `{ userIds, role }`, un evento por usuario)
GET    /api/users/:id/audit       (admin/tse)
POST   /api/users/:id/wallet/retry (admin; ver §14)
PATCH  /api/users/:id/deactivate   (admin; ver §12)
PATCH  /api/users/:id/reactivate   (admin; ver §12)

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

GET    /api/audit/bonds/:tokenId/traceability   (trazabilidad completa, todos los roles auth)
GET    /api/audit/...             (timeline/eventos)

GET    /api/notifications                 (propias; { notifications, unreadCount })
PATCH  /api/notifications/read-all
PATCH  /api/notifications/:id/read

GET    /api/health/live           (liveness, público, sin dependencias)
GET    /api/health                (readiness, público; ver §7)
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

### Endpoints del módulo audit

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/audit/bonds` | TSE/Admin | Buscar bonos con filtros |
| GET | `/audit/bonds/:tokenId/timeline` | TSE/Admin | Línea de tiempo completa del bono (bond + eventos + transfers con perfiles) |
| GET | `/audit/bonds/:tokenId/traceability` | Todos los roles | Trazabilidad consolidada: bond, events, transfers (sin perfiles embebidos), y `owners[]` derivado del servidor |
| GET | `/audit/events` | TSE/Admin | Eventos de auditoría recientes (paginados) |

#### GET /audit/bonds/:tokenId/traceability

Endpoint de trazabilidad consolidada. Reemplaza el patrón de dos fetch paralelos + derivación manual en el frontend.

**Auth:** Solo requiere `@UseGuards(AuthGuard)` — cualquier rol autenticado (tse, emisor, comprador, recomprador, validador, admin) puede acceder. **No tiene restricción TSE/admin**.

**Respuesta 200 OK:**
```json
{
  "bond": { /* BondToken camelCase */ },
  "events": [ /* AuditEvent[] camelCase */ ],
  "transfers": [ /* Transfer[] camelCase, SIN from_profile/to_profile */ ],
  "owners": [
    { "ownerId": "party-id", "name": "Partido Aurora", "since": "...", "until": "...", "paid": false, "current": false },
    { "ownerId": "user-id",  "name": "Juan Pérez",     "since": "...", "until": null,       "paid": true,  "current": true }
  ]
}
```

**Derivación de owners:**
1. Seed: `issuer_party_id` + `parties.name` desde el bono, con `since: bond.created_at`
2. Se iteran las transfers en orden cronológico ASC
3. Cada transfer cierra el owner anterior (`until`, `current=false`) y crea el nuevo
4. `paid: true` solo para transfers con status `liberada`
5. El último owner siempre tiene `current: true`

**404:** retorna el error estructurado descrito en la sección de contratos (`NOT_FOUND`).

**Seguridad:** Las transfers en la respuesta NO incluyen `from_profile` / `to_profile` (no hay fuga de datos de perfil).

## 5. Qué se necesita del humano

- [ ] `SUPABASE_SERVICE_ROLE_KEY` (Settings  a  API) para correr el backend.
- [ ] Confirmar Node 22+ disponible (o autorizar el polyfill `ws`).
- [ ] Para escrow real: dirección Stellar de plataforma + decisión de custodia + fondos testnet.
- [ ] Confirmar si la migración ya se aplicó a la base o si hay que aplicarla.

---

## 6. Contratos compartidos y validación runtime (issue #43)

`@velar/types` es la fuente de verdad para requests y responses JSON de `auth`, `bonds`,
`transfers`, `reports`, operaciones de `escrow`, `notifications` y `users`.

- `packages/types/src/schemas/`: schemas Zod por módulo.
- `packages/types/src/contracts.ts`: registro versionado `apiContracts`; asocia método, ruta,
  schemas de body/params/query y schema de respuesta.
- `packages/types/src/errors.ts`: códigos `ErrorCode`, catálogo español/inglés y forma estándar.
- Los DTOs de Nest conservan `class-validator` y Swagger; el contrato compartido agrega una
  segunda barrera sin remover reglas de negocio ni autorización.

El interceptor global `ContractValidationInterceptor` valida en el límite HTTP. Los requests se
validan siempre. Las respuestas se validan en desarrollo y tests; en producción se puede activar
con `CONTRACT_VALIDATE_RESPONSES=true`. Los downloads binarios se excluyen del registro JSON y el
upload multipart valida params y respuesta.

Forma de error estable:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Los datos enviados no son válidos.",
    "fields": { "email": ["Ingresá un correo electrónico válido."] }
  }
}
```

`ContractExceptionFilter` adapta también las excepciones existentes (`401`, `403`, `404`, reglas
de negocio y errores internos) a esta taxonomía. `Accept-Language: en` selecciona el catálogo en
inglés; español es el valor por defecto.

El signup público solo admite `usuario` y `partido`. `tse` y los demás roles privilegiados se
asignan por administración; nunca se autoasignan desde `/auth/register`.

### Comprobación local sin credenciales

```bash
npm run build --workspace @velar/types
npm run build --workspace apps/api
npm run lint --workspace apps/api
npm run test --workspace apps/api -- --runInBand
```

Las pruebas `common/contracts/*.spec.ts` validan payloads válidos/inválidos por cada módulo,
localización, drift de responses y que toda ruta JSON de los controladores cubiertos tenga contrato.

## 7. Lector de contratos y glosario (issue #39)

Módulo `apps/api/src/contracts/` — experiencia de lectura y comprensión del contrato de un bono.
Complementa el contrato legal en lenguaje simple; **nunca lo reemplaza**.

### Derivación a lenguaje simple (funciones puras)

`contracts/plain-language.ts` transforma un contrato estructurado + un glosario en explicaciones
por cláusula y un set de términos clave resaltados. Reglas:

- El significado legal **no se inventa**: el lenguaje simple viene de plantillas mantenidas por
  categoría de cláusula (`ClauseCategory`); el texto legal específico se preserva en `legalText`.
- Cláusulas sin plantilla (categoría o idioma sin cobertura) se marcan con `unknown: true` y
  `plainLanguage: ''` (la UI muestra un estado neutral, sin inventar).
- `extractKeyTerms` hace match de términos + alias como palabra completa (Unicode, sin distinguir
  mayúsculas), una referencia por término.
- `buildContractReaderResponse` arma el `ContractReaderResponse` tipado, con el glosario limitado a
  los términos referenciados y anchors por cláusula (`clausula-<order>`) para deep-link.

### Glosario (Supabase)

- Tabla `glossary_terms` (migración `20260701000000_glossary_terms.sql`): `id, term, definition,
  locale, aliases[], created_at`. **RLS: lectura pública** (`USING (true)`); escritura solo por
  `service_role` (backend). Semilla idempotente con los términos base en español.
- `ContractsService` lee el glosario vía `SupabaseService` (mockeable en tests) y deriva el lector
  con las funciones puras. El origen del contrato estructurado es la derivación real del epic #38
  (ver §11) — ya no un fixture.

### Endpoints (públicos — también los usa `/verificar/[id]`)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/contracts/glossary?locale=es` | Términos del glosario para un idioma |
| GET | `/contracts/:bondId/reader?locale=es` | `ContractReaderResponse` tipado del bono |

### Tipos

En `@velar/types`: `ContractReaderResponse`, `PlainLanguageClause`, `GlossaryTerm`, `ClauseKeyTerm`,
`ReaderLocale` (reader), y el modelo canónico `ContractSummary`/`ContractClause`/`ClauseCategory`
del epic #38 (ver §11).

### Comprobación local sin credenciales

```bash
npm run test --workspace apps/api -- --testPathPatterns contracts
```

Tests puros sobre el fixture (mapeo, `unknown` flagged, alias/palabra completa, subset de glosario,
anchors) y tests del servicio con `SupabaseService` mockeado (glosario tipado + reader response).
## 8. Reporte mensual: ciclo de vida y motor de cumplimiento (issue #40)

El módulo `reports` original solo guardaba metadata de texto libre. Se **extendió**
(sin reescribir lo anterior) a un reporte estructurado, versionado, con archivos y
conciliación contra los bonos que el partido posee on-chain. La lógica de negocio
central vive en **funciones puras** (`apps/api/src/reports/domain/`), probadas por
fixtures y sin acceso a DB.

### Esquema (migración `20260701000000_report_lifecycle_compliance.sql`)
- `reports`: se le agregan `period_year`, `period_month`, `current_version`,
  `submitted_at`; el `CHECK` de `status` se amplía al workflow completo. Único por
  `(party_id, period_year, period_month)`.
- `report_line_items`: concepto, monto, categoría (`ingreso|egreso|donacion|bono|otro`)
  y `bond_token_id` opcional (referencia declarada a un bono).
- `report_files`: metadata del adjunto (`file_path`, `checksum` sha-256, `scan_status`).
  El binario vive en el bucket privado `report-files` (`<party_id>/<report_id>/<file>`).
- `report_versions`: snapshot inmutable por envío (**append-only** vía trigger
  `deny_report_version_mutation`, igual que `audit_events`).
- `report_deadlines`: config de vencimientos (`due_day_of_month`, `grace_days`).
- RLS: el partido ve solo lo suyo; TSE/admin ven todo. Subida al bucket solo rol
  `emisor` a su carpeta.

### Workflow (`domain/workflow.ts`)
`borrador → enviado → en_revision → observado → reenviado → en_revision → aprobado`.
`aprobado` es terminal. `assertTransition` rechaza saltos ilegales; `resolveSubmit`
codifica primer envío (`borrador→enviado`) vs corrección (`observado→reenviado`,
que bumpea versión y preserva historial). Solo `borrador` y `observado` son editables.

### Conciliación (`domain/reconciliation.ts`)
Función pura `reconcile(declarados, poseídos)` que cruza las referencias de bono
declaradas contra los bonos que el partido tiene en cadena y emite discrepancias
tipadas: `amount_mismatch`, `missing_bond`, `unknown_reference`. Agrega montos por
bono y tolera ruido flotante sub-centavo. Determinística.

### Vencimientos (`domain/deadlines.ts`)
`computeCompliance` deriva el estado del período (`not_due | on_time | late |
overdue | missing`) y los días restantes a partir de la config, la fecha de envío y
un "hoy" de referencia. Un reporte vence el `due_day_of_month` del mes siguiente.

### Antivirus (`files/file-scanner.ts`)
Hook detrás de la interfaz `FileScanner` (token DI `FILE_SCANNER`). El default es
`StubFileScanner` (marca EICAR como infectado, el resto limpio) — sin vendor real.
Se reemplaza por ClamAV/VirusTotal sin tocar el resto del módulo.

### Endpoints (`reports/lifecycle`, todos con `@Roles('emisor')` en mutaciones)
- `POST /reports/lifecycle` — crea borrador
- `POST /reports/lifecycle/:id/line-items` · `DELETE .../:lineItemId` · `GET .../line-items`
- `POST /reports/lifecycle/:id/files` (multipart, valida tipo/tamaño + checksum + antivirus)
- `GET /reports/lifecycle/:id/reconciliation` — preview de discrepancias
- `POST /reports/lifecycle/:id/submit` — envía/reenvía: snapshot inmutable, audita
  (`report_version_created` + `report_submitted`/`report_resubmitted`) y notifica al
  partido y al TSE
- `GET /reports/lifecycle/:id` — detalle con líneas, archivos, versiones y conciliación

El TSE (revisión/observación/aprobación) es un **epic aparte**; este issue cubre el
lado del partido y el dominio compartido de reporte/conciliación.

### TSE governance layer (issue #41)

Capa de gobernanza del TSE sobre el ciclo de vida del reporte: workflow formal con
doble control y concurrencia optimista, motor de reglas, ABAC, audit log encadenado,
SLA/escalamiento, analytics de cumplimiento y exports con evidencia de integridad.
**Solo backend** — sin frontend de command center en este PR. Diseño completo:
`docs/TSE_GOVERNANCE_ARCHITECTURE.md`.

Endpoints nuevos o extendidos:

```
PATCH  /api/reports/:id/review          (extendido: expectedVersion, dual control, rechazado)
PATCH  /api/reports/:id/assign          (admin: asignar revisor)
GET    /api/reports/lifecycle/:id/findings
GET    /api/reports/lifecycle/:id/audit-chain
POST   /api/reports/lifecycle/rules/backtest   (admin)
POST   /api/sla/check                          (admin)
GET    /api/compliance-analytics/overview
GET    /api/compliance-analytics/by-party
GET    /api/compliance-analytics/reviewer-workload
GET    /api/compliance-analytics/forecast
GET    /api/reports/exports/decisions.csv
GET    /api/reports/exports/decisions.pdf
```

## 9. Procedencia y trazabilidad: reconstrucción de historia + integridad (issue #36)

Reconstruye la **historia verificada** de un bono a partir de la bitácora
append-only (`audit_events`), las `transfers` y los registros de escrow, y produce
un reporte de integridad con anomalías tipadas. La bitácora nunca se reordena ni
se muta (ver `docs/AGENTS.md` §4): el motor ordena una **copia**.

### Motor puro (`provenance/provenance-engine.ts`)
Funciones sin dependencias (ni Nest ni Supabase), fáciles de testear:
- `reconstructOwnership` — línea de tiempo de dueños (`OwnershipSegment[]`) a partir
  de los eventos de propiedad (`bond_emitido`, `bond_asignado`, `token_liberado`).
- `reconstructTransferLifecycle` — mapea los eventos de una transferencia a etapas
  ordenadas + índice de paso actual (`TRANSFER_LIFECYCLE_STEPS`) y si es terminal.
- `checkIntegrity` — anomalías tipadas: `out_of_order`, `ownership_gap`,
  `illegal_transition` (contra la máquina de estados `TRANSFER_TRANSITIONS`),
  `onchain_offchain_mismatch`, `missing_event`.
- `reconstructProvenance` — arma el `BondProvenance` + `IntegrityReport`.

### Servicio y endpoints (`provenance/`)
`ProvenanceService` es delgado: pide el `ProvenanceInput` a `AuditService`
(`getProvenanceInput` / `resolveTokenId`, que reutilizan los mappers de
trazabilidad) y corre el motor.
- `GET /bonds/:tokenId/provenance` — **autenticado** (cualquier rol): historia completa.
- `GET /public/bonds/:idOrToken/provenance` — **público** (verificación ciudadana);
  acepta `token_id` o el `bond_id` legible. La salida no expone mensajes privados
  de negociación (los lifecycles solo llevan estado + fechas).

### Tipos (`@velar/types`)
`BondProvenance`, `OwnershipSegment`, `TransferLifecycle`, `ProvenanceAnomaly` /
`ProvenanceAnomalyType`, `IntegrityReport`, `ProvenanceInput`, más el fixture
`provenanceFixture` para pruebas locales sin base de datos.

### Comprobación local sin credenciales
`npx jest` en `apps/api` (motor + servicio con `AuditService` mockeado). El motor
no toca la red ni la base; el servicio se prueba con dobles.

## 10. Analítica & BI: motor de agregación, alertas y reportes programados (issue #44)

Plataforma de analítica en tiempo real para el ecosistema de bonos: KPIs, breakdowns
por partido/país, embudo de transferencias, series de tiempo, cumplimiento de reportes,
alertas de umbral y exportación CSV/PDF. Mismo patrón que procedencia (§9): motor **puro**
fixture-testeado, sin tocar Supabase, con el acceso a datos aislado en un servicio propio.

### Motor puro (`analytics/engine/`)
Funciones sin dependencias, una por archivo:
- `aggregations.ts` — `aggregateByBondStatus`, `aggregateByParty`, `aggregateByCountry`,
  `aggregateValueVolume`.
- `funnel.ts` — `computeTransferFunnel`: cuenta transferencias por etapa usando el índice
  de `TRANSFER_LIFECYCLE_STEPS` (reutilizado de `@velar/types`, no redefinido). Sin eventos
  de auditoría en el input, los estados fuera del camino feliz (`contraoferta`, `rechazada`,
  `cancelada`) se cuentan aparte y no en las etapas.
- `timeseries.ts` — `bucketByDate` genérico (día/semana/mes, UTC) + series de emisión,
  transferencias liberadas y "throughput" de escrow (aproximado como `createdAt`→`updatedAt`
  de transferencias terminales; sin dependencia de `AuditEvent`).
- `trends.ts` — `periodOverPeriodDelta`, `movingAverage`, `topN`, `detectThresholdAnomalies`.
- `compliance.ts` — adapta `computeComplianceForPeriods` (`reports/domain/deadlines.ts`,
  reutilizado, no reimplementado) para agrupar por partido.
- `alerts.ts` — `evaluateAlertRules`: compara un `AnalyticsSnapshot` contra reglas por
  dot-path de métrica (`valueVolume.totalVolumeMoved`, etc.), sin I/O.
- `index.ts` — `buildAnalyticsSnapshot(input, query, scope, now, deadlineConfig)`: aplica
  `AnalyticsScope` (RBAC ya resuelto, el motor nunca importa `Role`) y `AnalyticsQuery`,
  compone todo lo anterior. Nunca muta `input`.

### Datos, servicio y RBAC (`analytics/`)
- `analytics-data.service.ts` — único lugar que toca `SupabaseService.admin.from(...)`;
  mapea `bonds`/`transfers`/`reports` a los tipos de `@velar/types`. Filtra reportes del
  modelo legado sin `period_year`/`period_month` (no alimentan cumplimiento).
- `analytics.service.ts` — `resolveScope(role, partyId)`: TSE/admin ven todo; `emisor` ve
  solo su partido; el resto no tiene acceso a analítica agregada. También: export CSV/PDF,
  CRUD de vistas guardadas (`analytics_saved_views`, por dueño) y reglas de alerta
  (`analytics_alert_rules`, TSE/admin), evaluación de alertas (emite notificaciones vía
  `NotificationsService.emit` con `NotificationType.ANALYTICS_THRESHOLD_BREACHED`, nunca
  lanza) y reporte programado manual. Mantiene sin cambios los endpoints legados de
  drill-down (`bonds/:tokenId/price-history`, `bonds/:tokenId/owners`, `top-bonds`,
  `legacy-export`) que usan Supabase en vivo con nombres de perfiles.
- `analytics.controller.ts` — rutas de solo-lectura resueltas por rol dentro del servicio;
  `@Roles('tse','admin')` (vía `RolesGuard`, global) en configuración privilegiada
  (reglas de alerta, disparo de reporte programado).

```
GET    /api/analytics/snapshot                (?from&to&country&partyId&status&bucket)
GET    /api/analytics/export?format=csv|pdf   (mismo query, snapshot-based)
GET    /api/analytics/top-bonds               (legado, detalle con nombres)
GET    /api/analytics/bonds/:tokenId/price-history   (legado, drill-down)
GET    /api/analytics/bonds/:tokenId/owners          (legado, drill-down)
GET    /api/analytics/legacy-export?format=csv       (legado, CSV con nombres)

GET    /api/analytics/views | POST | DELETE /:id      (vistas guardadas, por dueño)
GET    /api/analytics/alert-rules | POST | PATCH | DELETE /:id   (tse/admin)
POST   /api/analytics/alert-rules/:id/evaluate                    (tse/admin)
POST   /api/analytics/scheduled-reports/run                       (tse/admin, manual)
```

### Alertas y reporte programado: interfaz + stub
`ScheduledReportGenerator` (interfaz + token `SCHEDULED_REPORT_GENERATOR`, mismo patrón
que el hook de antivirus en `reports/files/file-scanner.ts`) tiene una única implementación
manual (`ManualScheduledReportGenerator`): genera CSV/PDF del snapshot actual bajo demanda.
No hay cron ni vendor — se dispara solo por `POST /scheduled-reports/run`.

### Exportación
- `csv/analytics-csv.ts` — `renderSnapshotCsv`: CSV determinístico del snapshot completo
  (breakdowns + totales), puro, sin nombres de perfiles (por eso convive con el CSV legado).
- `pdf/analytics-pdf.ts` — `renderAnalyticsPdf` con `pdf-lib` (JS puro, sin navegador headless).
  El contenido es determinístico; el orden interno de objetos del PDF no lo es entre
  ejecuciones, así que las pruebas son **estructurales** (header `%PDF-`, `PDFDocument.load`
  reabre el archivo, cuenta de páginas), no snapshots de bytes.

### Migración
`supabase/migrations/20260728000000_analytics_saved_views.sql` — tablas
`analytics_saved_views` (RLS: dueño) y `analytics_alert_rules` (RLS: TSE/admin). Aditiva,
no toca ninguna migración existente. Sin vista materializada de pre-agregación en v1 (el
volumen de datos de la demo no lo justifica todavía).

### Tipos (`@velar/types`)
`analytics.ts` — `AnalyticsInput`, `AnalyticsQuery`, `AnalyticsScope`, `AnalyticsSnapshot`
y cada breakdown/serie/trend, `AlertRule`/`AlertBreach`, `SavedView`, `ScheduledReportConfig`/
`Result`. Fixture en `fixtures/analytics.ts` (`analyticsFixture`, 3 partidos en 2 países,
todo el embudo de transferencias, cumplimiento on-time/late/missing).

### Comprobación local sin credenciales
`npx jest src/analytics` en `apps/api` (motor puro fixture-driven, capa de datos y servicio
con `SupabaseService`/`NotificationsService` mockeados, exportación CSV/PDF determinística).

## 11. Motor de inteligencia de contratos y ensamblado de documentos (issue #38)

Modelo estructurado y versionado del contrato de un bono: biblioteca de cláusulas reutilizables
y parametrizadas, plantillas por país, y derivación de un `ContractSummary` rico (monto,
condiciones, obligaciones por rol, fechas clave, estado y alertas de atención) — todo con
**funciones puras**, mismo patrón que procedencia (§9) y analítica (§10). El resumen
**complementa** el contrato legal; nunca lo reemplaza. Cierra el `@todo` de #39: el lector de
contratos ahora consume esta derivación real, ya no el fixture.

### Esquema (migración `20260729000000_contract_engine.sql`)
- `contract_clauses` — biblioteca de cláusulas reutilizables: `clause_key` (única), `category`
  (`contract_clause_category`, espeja `ClauseCategory`), `title`, `body_template` (con tokens
  `{{parametro}}`), `parameters[]`, `locale`. No se muta una cláusula ya referenciada por una
  versión publicada: se crea una nueva con otro `clause_key`.
- `contract_templates` — un tipo de contrato por jurisdicción: `key` (única), `country`
  (`CHECK` contra los países soportados), `name`, `description`.
- `contract_versions` — revisión de una plantilla: `template_id`, `version_number`, `status`
  (`draft|published|archived`), `clause_keys[]` (orden lógico), `notes`, `created_by`,
  `published_at`. Único por `(template_id, version_number)`.
- RLS: lectura pública en las tres (mismo razonamiento que `glossary_terms`: texto de plantilla
  legal, no sensible; habilita el lector público en `/verificar/[id]`); sin política de
  escritura — solo `service_role`. Semilla idempotente: plantilla CR (mismo texto que el fixture
  que usaba #39) + una segunda, CO, para ejercer de verdad el soporte multi-país.

### Motor puro (`contracts/domain/`)
- `template.ts` — `resolveClauseTemplate(bodyTemplate, params)`: sustituye tokens `{{param}}`;
  un parámetro faltante **nunca se inventa** — queda como `[dato no disponible: <param>]` y se
  reporta en `missingParameters`. Compartido por `summary.ts` y `assembly.ts`.
- `summary.ts` — `deriveContractSummary(input: ContractSummaryInput): ContractSummary`:
  - `status`: mapeo puro bono/transferencia → `ContractStatus`, según la máquina de estados de
    `docs/AGENTS.md` §4.
  - `amount`: monto de la transferencia activa (no `rechazada`/`cancelada`) o, si no hay, el
    valor facial del bono; `unknown: true` solo si ninguna de las dos existe.
  - `obligations`/`conditions`: plantillas mantenidas por `ClauseCategory` (mismo patrón que
    `plain-language.ts`), con `role: ContractPartyRole` (`tse|vendedor|comprador`, semántico —
    no el `Role` del sistema, para no requerir lookups de perfil en una función pura). Categorías
    sin plantilla simplemente no producen obligación/condición (nunca se fabrican).
  - `keyDates`: fechas de emisión/vencimiento del bono, publicación de la versión, y (si hay
    transferencia relevante) solicitud/último cambio/liberación; `unknown: true` cuando falta el
    dato fuente.
  - `attentionFlags`: reglas determinísticas (mismo enfoque que `analytics/engine/alerts.ts` y
    `reports/domain/deadlines.ts`) — `frozen`, `approaching_maturity`/`maturity_passed`,
    `stalled_escrow`, `amount_mismatch`, `missing_key_dates`.
- `assembly.ts` — `assembleContractDocument(input: AssembleDocumentInput)`: ensamblado
  determinístico del documento completo desde una versión + parámetros resueltos.
- `diff.ts` — `diffContractVersions(a, b): ContractVersionDiff`: compara `clauseKeys` ordenados
  entre dos versiones → `added`/`removed`/`changed` (texto u orden distinto)/`unchanged`.

### Servicio y endpoints
`ContractsService` reutiliza `AuditService.resolveTokenId`/`getProvenanceInput` (igual que
`ProvenanceService`) para no reimplementar el mapeo bono/transferencias; solo agrega una consulta
liviana para `country` (no incluido en ese mapper) y resuelve nombres de partes best-effort
(perfil/partido) para los parámetros del documento — si no se resuelven, quedan como parámetro
faltante, nunca se inventan.

`ContractEngineController` (nuevo, separado de `ContractsController` que sigue `@Public()` para
#39) requiere auth por defecto:

```
GET   /api/bonds/:tokenId/summary               (reusa la autorización de bonds.findOne)
GET   /api/contracts/templates                  (?country=)
POST  /api/contracts/templates                  (tse/admin)
GET   /api/contracts/templates/:id/versions
POST  /api/contracts/templates/:id/versions      (tse/admin)
GET   /api/contracts/versions/diff               (?from=&to=; declarado ANTES de :versionId)
GET   /api/contracts/versions/:versionId
PATCH /api/contracts/versions/:versionId/publish (tse/admin)
GET   /api/contracts/clauses                     (?category=)
POST  /api/contracts/clauses                     (tse/admin)
GET   /api/contracts/:bondId/document            (?versionId=)
```

Todos registrados en `apiContracts` (`@velar/types`, issue #43): request/response tipados y
cubiertos por `controller-contract-coverage.spec.ts` para `BondsController`.

### Tipos (`@velar/types`)
`contract-model.ts` — `ContractSummary` extendido (aditivo; los 5 campos que usa #39 no
cambiaron): `country`, `amount`, `conditions`, `obligations`, `keyDates`, `status`,
`attentionFlags`, más `ContractPartyRole`/`ContractStatus`/`ContractAttentionFlag`/etc.
`contract-engine.ts` (nuevo) — `ContractTemplate`, `ContractVersionSummary`/`Detail`,
`ContractClauseLibraryEntry`, `ContractVersionDiff`, `AssembledContractDocument`, y los inputs
de las funciones puras. Fixture en `fixtures/contract-engine.ts` (bono, transferencias,
plantilla CR con 2 versiones para probar el diff).

### Comprobación local sin credenciales
```bash
npm run test --workspace apps/api -- --testPathPatterns contracts
```
Funciones puras fixture-driven sin mocks (`domain/*.spec.ts`) + servicio con
`SupabaseService`/`AuditService` mockeados (`contracts.service.spec.ts`).

---

## 12. Ciclo de vida de la cuenta (issue #77)

`AuthService` solo tenía `login` y `register`: quien olvidaba la contraseña no podía
recuperarla, no había forma de cambiar el email, y no existía manera de desactivar una
cuenta comprometida. Esta capa cierra ese hueco **usando primitivos que Supabase Auth ya
provee**, sin agregar tablas ni columnas.

### Endpoints

```
POST  /api/auth/forgot-password   (público, 3/min)
POST  /api/auth/reset-password    (público, 5/min)
POST  /api/auth/change-email      (autenticado, 3/min)
PATCH /api/users/:id/deactivate   (admin)
PATCH /api/users/:id/reactivate   (admin)
```

Todos registrados en `apiContracts` (`@velar/types`) y cubiertos por
`controller-contract-coverage.spec.ts`.

### Decisiones que conviene conocer antes de tocar esto

**`forgot-password` responde siempre `{ ok: true }`.** Exista la cuenta o no, y aunque
Supabase falle. Si la respuesta, el código o el mensaje dependieran de si el email está
registrado, el endpoint se convertiría en un oráculo para enumerar cuentas. El error solo
se loguea. **No "arregles" esto devolviendo 404 cuando el usuario no existe.**

**El intento se audita igual, exista o no la cuenta.** Sirve para detectar abuso. Lo que
NO se registra es si el email existía, porque es justo el dato que no se filtra.

**Desactivar = banear en Supabase Auth** (`ban_duration: '876000h'`, ~100 años; `'none'`
para reactivar). Se usa el primitivo de Auth en vez de una columna `active` porque el
bloqueo ocurre en el emisor del token: con una bandera propia habría que acordarse de
chequearla en cada camino de autenticación, y el día que se olvide, la cuenta desactivada
vuelve a entrar. Por eso tampoco hace falta migración.

**`change-email` no aplica el cambio**: genera el enlace de confirmación de Supabase
(`generateLink`, tipo `email_change_new`), así que la dirección nueva solo queda activa
cuando su dueño confirma. Un token robado no alcanza para mudar la cuenta a otro correo.

**Un admin no puede desactivarse a sí mismo** — evita que el último admin se deje afuera.

### Eventos de auditoría

Todos vía `AuditService.emit()`, con los tipos nuevos en `@velar/types`:

| Evento | `actorId` | Payload |
|---|---|---|
| `auth_password_reset_requested` | `null` (anónimo) | `{ email }` |
| `auth_password_reset_completed` | dueño de la cuenta | — |
| `auth_email_change_requested` | dueño de la cuenta | `{ from, to }` |
| `auth_account_deactivated` | **el admin** | `{ targetUserId }` |
| `auth_account_reactivated` | **el admin** | `{ targetUserId }` |

### Rate limiting

`@nestjs/throttler` ya estaba en el proyecto y `login` ya llevaba `@Throttle` (10/min): se
extendió el mismo patrón en vez de introducir otro. `register` quedó en 5/min y
`forgot-password` en 3/min — más bajo porque es anónimo y provoca envío de correo, así que
sirve tanto para enumerar cuentas como para spamear una bandeja ajena.

### Configuración opcional

`AUTH_PASSWORD_RESET_REDIRECT_URL` — a dónde vuelve el usuario desde el enlace de
recuperación. Si no está, se usa el default de Supabase.

### Comprobación local sin credenciales
```bash
npm run test --workspace apps/api -- --testPathPatterns lifecycle
```
`SupabaseService` y `AuditService` mockeados en `auth/auth-lifecycle.service.spec.ts` y
`users/users-lifecycle.service.spec.ts`. Sin base de datos, sin `service_role`, sin correo
real.

---

## 13. Health checks: liveness/readiness con detalle por dependencia (issue #80)

`HealthModule` (`apps/api/src/health/`) expone dos endpoints públicos (`@Public()`, sin auth):

```
GET /api/health/live    liveness  : el proceso responde. Sin llamadas externas, siempre rápido.
GET /api/health         readiness : chequea TODAS las dependencias reales, en paralelo.
```

Se mantuvo `GET /health` como el endpoint de readiness (compatibilidad con quien ya lo consuma)
y se agregó `/health/live` como el endpoint liviano nuevo, en vez de mover ambos a `/health/ready`.

### `GET /health/live`

No hace ninguna llamada de red. Responde siempre rápido:

```json
{ "status": "ok", "uptime": 123, "version": "0.0.1", "commit": "unknown", "deployedAt": "2026-08-28T19:00:00.000Z" }
```

### `GET /health` (readiness)

Chequea, todas en paralelo con `Promise.all` (una dependencia lenta no bloquea a las demás) y
con el mismo timeout de 3s por dependencia que ya existía:

- **Supabase** (`up`/`down`) : sin cambios, igual que antes.
- **Stellar Horizon** (`up`/`down`, campo `stellar`) : sin cambios, igual que antes.
- **Soroban RPC** (`up`/`down`, campo `soroban`, **nuevo**) : llama `getHealth` sobre
  `SOROBAN_RPC_URL` (`apps/api/src/escrow/stellar.config.ts`). Antes un Horizon sano podía
  esconder un RPC de contratos caído; ahora se reporta aparte.
- **Wallets de plataforma y escrow** (campo `wallets.platform` / `wallets.escrow`, **nuevo**) :
  lee el balance nativo (XLM) de cada cuenta vía Horizon.
  - `ok` : balance ≥ `ESCROW_MIN_XLM_BALANCE` (default 5 XLM).
  - `degraded` : balance por debajo del umbral — riesgo real de incidente (no puede pagar fees /
    reservas), pero el servicio sigue funcionando, así que NO tira 503.
  - `down` : la cuenta configurada es inalcanzable (Horizon no responde o la cuenta no existe).
  - `unconfigured` : no hay `WalletService.platformAddress`/`escrowAddress` (dev/test sin
    credenciales VELAR). No es un incidente, así que no afecta el status agregado.

Respuesta cuando todo está sano:

```json
{
  "status": "ok",
  "supabase": "up",
  "stellar": "up",
  "soroban": "up",
  "wallets": {
    "platform": { "status": "ok", "label": "platform", "address": "G...", "balanceXlm": 42.5, "minBalanceXlm": 5 },
    "escrow":   { "status": "ok", "label": "escrow",   "address": "G...", "balanceXlm": 30.1, "minBalanceXlm": 5 }
  },
  "uptime": 4213,
  "version": "0.0.1",
  "commit": "unknown",
  "deployedAt": "2026-08-28T19:00:00.000Z"
}
```

**Status agregado y código HTTP:**

- `status: "ok"` → HTTP 200.
- `status: "degraded"` → HTTP 200 (algo pide atención — ej. wallet con balance bajo — pero
  ninguna dependencia crítica está caída).
- `status: "down"` → HTTP 503 (`HttpException`, igual que antes). Se dispara si Supabase, Horizon,
  Soroban RPC, o una wallet **configurada** están caídos. `unconfigured` nunca dispara `down`.

**Build/version info:** `version` sale de `npm_package_version` (lo inyecta `npm` en runtime);
`commit` de `GIT_COMMIT_SHA` / `VERCEL_GIT_COMMIT_SHA` / `RENDER_GIT_COMMIT` (el que exista según
la plataforma de deploy) o `"unknown"` en local; `deployedAt` de `DEPLOYED_AT` si el deploy la
define, si no cae al momento en que arrancó el proceso.

**Variables de entorno nuevas (opcionales, con default sensato):**

```bash
ESCROW_MIN_XLM_BALANCE=5   # umbral de balance nativo bajo el cual una wallet se reporta 'degraded'
GIT_COMMIT_SHA=            # opcional, para el payload de debugging
DEPLOYED_AT=               # opcional, ISO timestamp del deploy
```

### Comprobación local sin credenciales

`HealthService.spec.ts` mockea `SupabaseService` y `WalletService`, y usa `jest.spyOn(globalThis, 'fetch')`
para simular Horizon/Soroban — no se necesita conexión real a testnet ni credenciales VELAR:

```bash
npm run build --workspace apps/api
npm run lint --workspace apps/api
npm run test --workspace apps/api -- health
```

---

## 14. Reconciliación de wallets de custodia (`failed` → retry)

`AuthService.register` y `UsersService.ensureProfileWallet` llaman a `WalletService.createWalletRecord()`. Friendbot (testnet) puede fallar; **el registro no se aborta**: se persiste `stellar_wallet_status = 'failed'` y el mensaje en `stellar_wallet_error`. Un perfil o partido en `failed` no puede recibir tokens de bono hasta que haya una cuenta funded.

Esto **no** cambia el interior de Friendbot ni de `createWalletRecord()`. La capa de resiliencia es `WalletReconciliationService`: vuelve a llamar al mismo método.

### Por qué quedan wallets `failed` (y por qué GET no las sana)

- **Register:** si `createWalletRecord()` tira o devuelve `status: 'failed'`, el profile (y el party, si aplica) se guarda igual, con status/error. El alta de cuenta no depende de Friendbot.
- **`ensureProfileWallet`:** corre solo desde `getProfile` cuando `stellar_wallet` está vacío. Si Friendbot falla, `createWalletRecord()` **igual persiste un keypair** y el profile queda con `stellar_wallet` seteado y status `failed`.
- **`getProfile` no reintenta** si `stellar_wallet` ya tiene valor. Un failed con clave pública **nunca** se auto-repara en `GET /api/users/me`. La reconciliación tiene que filtrar por **status**, no por “falta de clave”.

### Cómo selecciona el job

Consulta `profiles` y `parties` con `stellar_wallet_status = 'failed'`, índices parciales en `20260829000000_custodial_wallet_retry.sql`.

Además exige `stellar_wallet_retry_count < 5` y que el backoff sobre `stellar_wallet_last_retry_at` ya haya vencido (si nunca se reintentó, entra). El lote está acotado (~10 filas) para caber en una invocación serverless de 60s y no martillar Friendbot.

### Reintentos acotados

Columnas (profiles y parties): `stellar_wallet_retry_count` (default 0), `stellar_wallet_last_retry_at`, más las existentes `stellar_wallet_status` / `stellar_wallet_error`.

| Resultado | Persistencia |
|---|---|
| Éxito (`created` / `funded`) | Actualiza clave, status, limpia `stellar_wallet_error`, resetea `retry_count`. |
| Falla | Incrementa `retry_count`, escribe `stellar_wallet_error`, setea `last_retry_at`. |

Tope **5** intentos. Backoff exponencial a partir de `last_retry_at` (p. ej. 1m, 5m, 15m, 1h, 6h). Al llegar al máximo, el job **omite** la fila.

Cada reintento llama `createWalletRecord(label)` otra vez. Ese método hace `Keypair.random()`: **es un keypair nuevo**, no un “fund” de la clave failed. Queda aceptado en este epic; no se agregó un fund-existing-key.

### Por qué no hay `@nestjs/schedule`

La API corre en **Vercel serverless** (`vercel.api.json`, `api/index.ts`, `maxDuration` 60s). Un cron de `@nestjs/schedule` no corre entre invocaciones en frío: no está en el stack y **no** hay que agregarlo.

El lote `WalletReconciliationService.reconcileFailedWallets()` no está en un cron Nest. Hoy se dispara el reintento **por usuario** con `POST /api/users/:id/wallet/retry` (admin). El método de lote queda listo para un Vercel Cron / HTTP futuro; no es un proceso Nest de larga duración.

### `POST /api/users/:id/wallet/retry` (solo admin)

Reintento **manual de un usuario**. Misma barra que `setRole` / `deactivate`: `actorRole !== 'admin'` → `ForbiddenException`. **TSE no reintenta.** No es self-retry; no toca `PATCH /api/users/me/wallet` (Freighter).

Si la operación no tira, `AuditService.emit()` con tipo `wallet_retry_requested` (`AuditEventType`; valor en `audit_event_type` vía `20260829000001_wallet_retry_audit_event.sql`). `actorId` = admin. Payload típico: `targetUserId`, status previo/nuevo, `publicKey` / `error` si aplica.

### Superficie en `GET /api/users`

`listUsers` (admin/tse) ya hace `select('*, parties(*)')`. Con las columnas de wallet en el schema, el directorio **ya trae** `stellar_wallet_status`, `stellar_wallet_error`, `retry_count` y `last_retry_at` — no hace falta un endpoint extra de “salud de wallet”.

### Comprobación local sin credenciales

Specs con `WalletService.createWalletRecord` y `SupabaseService` mockeados (mismo patrón que `users-lifecycle.service.spec.ts`). **Sin** Friendbot real, testnet ni credenciales VELAR.

```bash
npm run test --workspace apps/api -- --testPathPatterns wallet-reconciliation
```
