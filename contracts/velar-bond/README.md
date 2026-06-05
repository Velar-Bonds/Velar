# VELAR Bond — Soroban Smart Contract

Cada bono político emitido por el TSE es un contrato Soroban individual desplegado
en Stellar testnet. La cadena guarda la fuente de verdad: monto, fechas, dueño
actual, partido emisor, hash del documento, estado. Postgres queda como índice/cache.

## Qué hace el contrato

Cada bono tiene su propio contrato con:

- `initialize(...)` — solo el TSE puede crear el bono con todos los atributos
- `transfer(to)` — el dueño actual transfiere el bono a otra wallet
- `freeze()` / `unfreeze()` — solo el TSE puede congelar/descongelar
- `set_in_escrow()` / `set_active()` — el dueño publica o retira del marketplace
- `details()` — lectura pública de todos los atributos
- `current_owner()` — dueño actual on-chain
- `status()` — Active / InEscrow / Frozen / Sold / Cancelled

Eventos emitidos: `issued`, `transfer`, `frozen`, `unfrozen`, `inescrow`, `active`.

## Setup (una vez)

### 1. Instalar Rust

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"
rustup target add wasm32-unknown-unknown
```

### 2. Instalar Stellar CLI

```bash
cargo install --locked stellar-cli@22.0.0
```

### 3. Configurar identidad testnet

```bash
stellar keys generate --global velar-deployer --network testnet
stellar keys fund velar-deployer --network testnet
```

## Compilar el contrato

```bash
cd contracts/velar-bond
stellar contract build
```

Genera `target/wasm32-unknown-unknown/release/velar_bond.wasm`.

## Correr los tests

```bash
cargo test
```

Espera 8 tests que validan: init único, transferencia, freeze/unfreeze, validación de dueño, reventa, etc.

## Deploy a testnet

```bash
# Sube el WASM una sola vez. Devuelve un wasm_hash.
stellar contract upload \
  --wasm target/wasm32-unknown-unknown/release/velar_bond.wasm \
  --source velar-deployer \
  --network testnet

# Guarda el wasm_hash en .env del API:
#   SOROBAN_VELAR_BOND_WASM_HASH=<hash>
```

Después, cada nuevo bono se despliega como una **instancia** del contrato (no se vuelve a subir el WASM cada vez, solo se referencia el hash):

```bash
stellar contract deploy \
  --wasm-hash <hash> \
  --source velar-deployer \
  --network testnet
```

Eso devuelve el `contract_id` del bono nuevo, que se guarda en la fila `bonds.soroban_contract_id`.

## Integración con NestJS

El backend de VELAR detecta automáticamente si `SOROBAN_VELAR_BOND_WASM_HASH`
está definido en `.env`:

- **Si está definido**: cuando el TSE aprueba una solicitud, en lugar de emitir
  un Classic Asset, despliega una instancia del contrato Soroban y llama a
  `initialize(...)` con todos los atributos del bono.
- **Si no está definido**: usa el flujo Classic Asset actual.

Esto permite migrar gradualmente sin romper los bonos viejos.

## Arquitectura

```
┌─────────────────┐         ┌──────────────────────────┐
│  NestJS API     │         │  Stellar Testnet         │
│                 │         │                          │
│  approve() ─────┼────────►│  1. deploy contract      │
│                 │         │  2. initialize(...)      │
│  ┌───────────┐  │         │     ├─ monto             │
│  │ Postgres  │◄─┼─events──┤     ├─ partido           │
│  │ (cache)   │  │         │     ├─ certificate hash  │
│  └───────────┘  │         │     ├─ owner             │
└─────────────────┘         │     └─ status            │
                            │                          │
                            │  transfer() ◄──── owner  │
                            │  freeze()   ◄──── TSE    │
                            └──────────────────────────┘
```

La BD recibe los eventos del contrato (via indexer o polling) y se mantiene
sincronizada como cache para búsquedas rápidas (marketplace, analytics).

## Costos en testnet

Gratis. En mainnet el deploy de un contrato cuesta ~1 XLM (~$0.10 USD) y cada
invocación ~0.001 XLM.

## Próximos pasos

1. Compilar y correr los tests
2. Subir el WASM una vez a testnet, anotar el `wasm_hash`
3. Agregar `SOROBAN_VELAR_BOND_WASM_HASH=<hash>` al `.env`
4. NestJS automáticamente empezará a desplegar bonos como contratos Soroban
5. Los bonos viejos siguen funcionando como Classic Assets (compatibilidad)
