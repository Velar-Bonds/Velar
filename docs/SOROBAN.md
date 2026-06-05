# VELAR — Bonos como NFT Soroban

## Qué es

Cada bono se vuelve un **contrato Soroban propio en Stellar testnet** con TODA su metadata
on-chain (monto, fechas, dueño, partido, certificado, hash del documento, estado).

Postgres deja de ser la fuente de verdad y pasa a ser un **cache + índice** para queries
rápidas. Si Postgres se pierde, el estado se puede reconstruir desde Stellar leyendo los
contratos.

## Arquitectura

```
┌──────────────────────┐     ┌──────────────────────┐
│   Postgres (cache)   │ ←─→ │  Soroban (verdad)    │
│  - filas para UI     │     │  - 1 contrato/bono   │
│  - filtros rápidos   │     │  - reglas inmutables │
└──────────────────────┘     └──────────────────────┘
```

| Capa | Vive en | Mutable | Velocidad |
|---|---|---|---|
| Stellar Classic Asset (token único) | Stellar testnet | No | 3-5s/tx |
| **Soroban contract (NFT con atributos)** | Stellar testnet | Solo via funciones del contrato | 5-7s/tx |
| Postgres `bonds` row | Supabase | Sí (cache) | <50ms |

## Cómo activarlo

### 1. Compilar y subir el WASM

Requiere [stellar-cli](https://github.com/stellar/stellar-cli) y `rustup` con target wasm32.

```bash
# Una sola vez: instalar target wasm
rustup target add wasm32-unknown-unknown

# Compilar y subir
./scripts/soroban-deploy-wasm.sh platform
```

El script imprime las 2 variables que hay que agregar a `apps/api/.env`:

```env
SOROBAN_VELAR_BOND_WASM_HASH=<hash hex 64 chars>
SOROBAN_TSE_ADDRESS=<public key Stellar>
```

### 2. Aplicar la migración

En el SQL Editor de Supabase:

```sql
ALTER TABLE bonds
  ADD COLUMN IF NOT EXISTS soroban_contract_id   text,
  ADD COLUMN IF NOT EXISTS soroban_init_tx_hash  text,
  ADD COLUMN IF NOT EXISTS soroban_deployed_at   timestamptz,
  ADD COLUMN IF NOT EXISTS soroban_error         text;

CREATE INDEX IF NOT EXISTS idx_bonds_soroban_contract
  ON bonds(soroban_contract_id) WHERE soroban_contract_id IS NOT NULL;
```

### 3. Reiniciar el backend

Cuando `SorobanBondService.enabled === true`, cada aprobación de bono dispara
en paralelo: Classic Asset (compatibilidad) **y** deploy del contrato Soroban.

Si Soroban falla, el flujo sigue con Classic Asset y se loguea el error en
`bonds.soroban_error`.

## Qué se gana

- **Inmutabilidad real**: los atributos del bono (monto, fechas, partido) no se
  pueden alterar editando la BD. Solo las funciones del contrato pueden modificar
  estado, y las reglas las define el código en Rust.
- **Verificación pública independiente**: cualquier persona llama
  `current_owner()` o `details()` del contrato sin pedirle nada a VELAR.
- **Auditabilidad del código**: el contrato es público. Un auditor lee el Rust y
  verifica que el TSE no puede cambiar el monto, que solo el dueño transfiere, etc.
- **Eventos on-chain ricos**: cada transferencia/congelación emite eventos
  indexables por TheGraph/Subquery.

## Qué se pierde

- **Latencia**: aprobar un bono pasa de 500ms a ~5s (Stellar Soroban tarda en
  confirmar el deploy + initialize).
- **Costo**: en mainnet cada deploy cuesta ~1 XLM. En testnet es gratis.
- **Curva de aprendizaje**: el equipo necesita aprender Rust + Soroban SDK.

## Funciones del contrato

```rust
// Setup (solo el TSE puede invocar, una sola vez por contrato)
initialize(tse, party_id, party_owner, bond_id, certificate_number,
           series, face_value, currency, interest_rate_bps,
           issue_date, maturity_date, document_hash)

// Cambia de dueño (solo el dueño actual puede invocar)
transfer(to: Address)

// TSE pausa transferencias
freeze()

// TSE las reactiva
unfreeze()

// Dueño marca/desmarca el bono en marketplace
set_in_escrow()
set_active()

// Lecturas gratis (cualquiera)
details() -> BondDetails
current_owner() -> Address
status() -> Status
tse() -> Address
```

## UI

En `/tse/registros`:

- Bonos con Soroban contract muestran un chip morado **🪙 NFT** al lado del
  link de Stellar Classic.
- En el detalle expandido aparece la card morada con el contractId completo y
  link directo a Stellar Expert.

## Estado actual

- ✅ Contrato Rust completo y testeado (`contracts/velar-bond/`)
- ✅ `SorobanBondService` en NestJS
- ✅ Integración en `BondsService.approveRequest`
- ✅ Migración SQL para `soroban_contract_id` y campos relacionados
- ✅ Chips visuales en TSE
- ⏳ **Falta:** compilar el WASM y subirlo a testnet
  (correr `./scripts/soroban-deploy-wasm.sh`)
