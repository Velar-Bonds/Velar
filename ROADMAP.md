# VELAR — Roadmap

> Estado al **10 Jun 2026**. Organizado por impacto de producto para contribuidores externos (GrantFox).

VELAR es infraestructura pública para tokenizar y trazar la propiedad de bonos políticos en Costa Rica sobre la blockchain de Stellar. Este roadmap guía las contribuciones de la comunidad.

---

## Índice

- [Estado actual](#estado-actual)
- [Fase 1 — Auditoría y trazabilidad](#fase-1--auditoría-y-trazabilidad)
- [Fase 2 — Documentos y notificaciones](#fase-2--documentos-y-notificaciones)
- [Fase 3 — Web3 progresivo](#fase-3--web3-progresivo)
- [Fase 4 — Institucional](#fase-4--institucional)
- [Deuda técnica](#deuda-técnica)
- [Niveles Web3](#niveles-web3)
- [Notas de arquitectura](#notas-de-arquitectura)

---

## Estado actual

| Área | Estado |
|---|---|
| Auth multi-rol (TSE / Partido / Usuario) | ✅ |
| Wallets Stellar custodiales (Friendbot testnet) | ✅ |
| Emisión de bonos: Classic Asset + contrato Soroban | ✅ |
| Contrato `VelarBond` (Soroban/Rust, 9 funciones) | ✅ |
| Escrow on-chain vía Trustless Work | ✅ |
| Flujo completo de compra/venta (6 pasos) | ✅ |
| Analytics TSE (overview, por partido, precios, owners) | ✅ |
| Marketplace con ofertas y contra-ofertas | ✅ |
| Sistema de reportes partido → TSE | ✅ |
| Explorador público `/explorer` | ✅ |
| Integration tests (9 escenarios de flujo) | ✅ |
| Notificaciones in-app | ❌ |
| Documentos PDF con hash on-chain | ❌ |
| Endpoint unificado de trazabilidad | ❌ |
| Tests del contrato Soroban | ⚠️ Parcial |
| CI/CD GitHub Actions | ❌ |

---

## Fase 1 — Auditoría y trazabilidad

> El core del sistema ya funciona. Estas tareas fortalecen la capa de auditoría que es el diferenciador institucional de VELAR.

### 1.1 Endpoint unificado de trazabilidad

Hoy el frontend construye la cadena de propietarios a partir de dos endpoints separados (`/bonds` + `/transfers`). Esto es frágil y disperso.

**Trabajo requerido:**

- [ ] Backend: `GET /audit/bonds/:tokenId/traceability` que devuelva un objeto canónico:
  ```json
  {
    "bond": { ... },
    "events": [ ...audit_events en orden cronológico ],
    "transfers": [ ...transfers del bono ],
    "owners": [ { "name", "since", "until", "paid", "current" } ]
  }
  ```
- [ ] Frontend: migrar `tse/trazabilidad` y `partido/trazabilidad` a consumir este endpoint

---

### 1.2 Eventos de auditoría faltantes

Hay acciones críticas que no emiten evento en `audit_events`. El registro debe ser completo.

**Eventos que falta emitir:**

| Evento | Dónde agregarlo |
|---|---|
| `party_created` | `PartiesService.create()` |
| `wallet_provisioned` | `WalletService.provisionWallet()` |
| `bond_published` | `BondsService.publish()` |
| `offer_rejected` | `TransfersService.reject()` |
| `counter_offer_sent` | `TransfersService.counterOffer()` |

Cada evento debe incluir: `type`, `bondTokenId`, `actorId`, `payload` (datos relevantes), `txHash` si aplica.

---

### 1.3 Notificaciones in-app

**Trabajo requerido:**

- [ ] Migración SQL: tabla `notifications` (`id uuid`, `user_id uuid`, `type text`, `payload jsonb`, `read bool default false`, `created_at timestamptz`)
- [ ] Backend `NotificationsModule`: `emit(userId, type, payload)` + `GET /notifications` + `PATCH /notifications/:id/read` + `PATCH /notifications/read-all`
- [ ] Llamar `emit()` desde `TransfersService` y `BondsService` en cada evento relevante
- [ ] Frontend: badge con contador en el navbar + panel desplegable
- [ ] `NotificationType` en `@velar/types`

**Tipos prioritarios:** `offer_received`, `offer_accepted`, `offer_rejected`, `payment_confirmed`, `bond_approved`, `bond_rejected`, `counter_offer_received`

---

## Fase 2 — Documentos y notificaciones

### 2.1 Documentos PDF de bonos con hash on-chain

Un bono político sin certificado digital no es creíble institucionalmente. La columna `document_hash` ya existe en `VelarBond` (Soroban) pero nunca se popula con un PDF real.

**Trabajo requerido:**

- [ ] Supabase Storage: bucket `bond-documents` con RLS (solo TSE puede subir, propietario puede descargar)
- [ ] Backend: `POST /bonds/:tokenId/document` — recibe PDF, calcula SHA-256 server-side, sube a Storage, guarda hash en `bonds.document_hash` y lo sincroniza al contrato Soroban vía `initialize` o una función de actualización
- [ ] Backend: `GET /bonds/:tokenId/document` para descarga autenticada
- [ ] Frontend: formulario de subida en la página de emisión del TSE
- [ ] Frontend: botón "Verificar autenticidad" — descarga el PDF, recalcula SHA-256 en el browser y lo compara con el hash guardado on-chain en el contrato Soroban

---

### 2.2 Notificaciones por email (Resend)

- [ ] Integrar [Resend](https://resend.com) en el backend (`RESEND_API_KEY` en `.env.example`)
- [ ] Templates de texto plano para: `offer_received`, `bond_approved`, `payment_confirmed`
- [ ] Opt-in en la página de configuración del usuario
- [ ] El módulo de notificaciones llama al servicio de email después de persistir cada notificación

---

### 2.3 Paginación en endpoints de lista

`/bonds`, `/transfers` y `/audit/events` devuelven todos los registros sin límite.

- [ ] Parámetros `?page=1&limit=20` en los tres endpoints
- [ ] Respuesta: `{ data: T[], total: number, page: number, limit: number }`
- [ ] Tipo `PaginatedResponse<T>` en `@velar/types`
- [ ] Frontend: controles anterior/siguiente en tablas largas

---

### 2.4 Exportación de datos para auditoría externa

- [ ] `GET /analytics/export?format=csv` — transferencias liberadas con: `bond_id`, `fecha`, `vendedor`, `comprador`, `monto`, `partido`
- [ ] Frontend: botón "Exportar CSV" en la página de analytics del TSE

---

## Fase 3 — Web3 progresivo

### 3.1 Tests completos del contrato `VelarBond` (+fundación)

`contracts/velar-bond/src/test.rs` existe pero está incompleto. Sin tests, cualquier cambio al contrato es riesgoso.

**Tests requeridos:**
- [ ] `initialize` exitoso y falla con `AlreadyInitialized`
- [ ] `transfer` exitoso, falla con `NotOwner`, falla con `SameOwner`
- [ ] `freeze` / `unfreeze` — solo TSE puede llamarlos, falla con `NotTse`
- [ ] `set_in_escrow` / `set_active` — solo el dueño, falla si está congelado
- [ ] `details`, `current_owner`, `status`, `tse` — vistas read-only

---

### 3.2 Función `redeem()` en `VelarBond`

Los bonos tienen `maturity_date` en el contrato pero no hay función de redención. El vencimiento no tiene flujo.

- [ ] Agregar estado `Redeemed` al enum `Status` en Rust
- [ ] Función `redeem(env: Env)`: solo el TSE puede llamarla, valida que `env.ledger().timestamp() >= maturity_date`, marca el bono como `Redeemed`, emite evento on-chain
- [ ] Backend `BondsService`: detectar bonos próximos a vencer (30 días) y expuestos para redención
- [ ] Backend: endpoint `PATCH /bonds/:tokenId/redeem` que invoque `VelarBond.redeem()` vía Soroban
- [ ] Actualizar tipos en `@velar/types`: `BondStatus.REDIMIDO`

---

### 3.3 Documentos en IPFS en lugar de Supabase Storage

Depende de §2.1. En lugar de guardar el PDF en Supabase Storage, anclarlo en IPFS.

- [ ] Integrar cliente IPFS (Pinata o web3.storage) en el backend
- [ ] Al subir el documento, anclar en IPFS y guardar `ipfs_cid` en la BD (además del SHA-256 on-chain)
- [ ] Frontend: mostrar CID y link a `ipfs.io/ipfs/<cid>` en la vista del bono
- [ ] El `document_hash` en el contrato Soroban sigue siendo el SHA-256 — es la referencia de integridad; el CID es el puntero de acceso

---

### 3.4 Contrato `VelarMarketplace` en Soroban

Hoy el marketplace vive completamente en Postgres. La lógica de publicación y ofertas podría vivir on-chain.

- [ ] Nuevo contrato Soroban `VelarMarketplace`: `list_bond(bond_contract_id, price)`, `make_offer(amount)`, `accept_offer(offer_id)`, `cancel_listing()`
- [ ] Al aceptar una oferta, el contrato llama `VelarBond.set_in_escrow()` atómicamente
- [ ] Backend: adaptar `TransfersService` para leer/escribir estado desde el contrato en lugar de solo Postgres
- [ ] Tests del contrato en Rust

---

### 3.5 Integración con Freighter (wallets soberanas del usuario)

Actualmente las wallets son custodiales (llaves en el servidor). Freighter permite que el usuario controle sus propias llaves.

- [ ] Integrar [Freighter](https://freighter.app/) como opción de firma en el browser
- [ ] Fallback: wallet custodial para usuarios sin extensión instalada
- [ ] El flujo de firma de transacciones migra de "el backend firma" a "el usuario firma desde Freighter"
- [ ] Documentar el proceso de migración para usuarios existentes con wallet custodial

---

## Fase 4 — Institucional

### 4.1 Vencimiento automático de bonos

- [ ] Job programado (cron) que detecta bonos con `maturity_date <= now() + 30 días`
- [ ] Notificación automática al dueño actual
- [ ] Flujo de redención completo: dueño solicita → TSE aprueba → `VelarBond.redeem()` on-chain

### 4.2 Validador de pagos como rol separado

- [ ] Nuevo rol `validador` en `@velar/types`
- [ ] `PATCH /transfers/:id/validate-payment` exclusivo para validadores
- [ ] Shell de validador con cola de pagos pendientes

### 4.3 KYC básico (manual)

- [ ] Campo `kyc_status` en `profiles` (`pendiente` | `verificado` | `rechazado`)
- [ ] Panel TSE para aprobar/rechazar solicitudes de KYC
- [ ] El marketplace bloquea ofertas de usuarios sin KYC verificado

### 4.4 Roles internos de partido

- [ ] Tabla `party_members` con `party_id`, `user_id`, `party_role` (`tesorero` | `legal` | `lector`)
- [ ] Solo el tesorero puede publicar y aceptar transferencias
- [ ] Solo el legal puede firmar reportes al TSE

---

## Deuda técnica

| Item | Prioridad |
|---|---|
| CI con GitHub Actions (lint + build en cada PR) | Alta |
| Encriptar wallets custodiales (AES-256 antes de mainnet) | Alta |
| Rate limiting con `@nestjs/throttler` | Media |
| `GET /api/health` (healthcheck de Supabase + Stellar) | Baja |

---

## Niveles Web3

| Nivel | Qué agrega | Web3 % | Estimado |
|---|---|---|---|
| **1 (actual)** | Soroban + Trustless Work + Classic Asset | ~27% | — |
| **2** | IPFS para documentos (§3.3) | ~32% | 1 día |
| **3** | Contrato de Marketplace on-chain (§3.4) | ~47% | 7 días |
| **4** | Escrow trustless completo (§3.5 parcial) | ~52% | 3 días |
| **5** | Wallets soberanas Freighter (§3.5) | ~62% | Alta complejidad |
| **6** | Gobernanza DAO | ~67% | 3 días |

---

## Notas de arquitectura

### Arquitectura paralela: Classic Asset + Soroban

VELAR usa dos capas simultáneamente:
- **Classic Asset**: token único en Stellar (cantidad `1`). Garantiza compatibilidad con todos los exploradores.
- **Soroban** (`VelarBond`): contrato individual por bono con metadata completa on-chain.

Son complementarios — el Classic Asset es el token de propiedad; el contrato Soroban es el registro de metadata.

### Custodia asistida

Las llaves privadas de wallets viven en el servidor (`.stellar-wallets.json`, gitignored). Decisión pragmática para testnet. Debe migrarse a encriptación + HSM antes de mainnet.

### VCRC

Activo simbólico en Stellar que representa colones costarricenses para registrar precios de transacciones on-chain. No es convertible ni tiene valor monetario.

### Node 22+

El cliente de Supabase falla con WebSocket en Node 20. Se requiere Node 22+.
