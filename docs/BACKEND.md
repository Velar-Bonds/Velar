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

GET    /api/audit/bonds/:tokenId/traceability   (trazabilidad completa, todos los roles auth)
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
