# Web3 en VELAR : Conceptos, herramientas y cómo se aplican

> Guía técnica concisa de todos los conceptos de blockchain y Web3 usados en la plataforma.

---

## Índice

1. [¿Qué es Web3 y por qué VELAR lo usa?](#1-qué-es-web3-y-por-qué-velar-lo-usa)
2. [Stellar : la blockchain elegida](#2-stellar--la-blockchain-elegida)
3. [Tokens / Activos nativos de Stellar](#3-tokens--activos-nativos-de-stellar)
4. [Wallets y custodia asistida](#4-wallets-y-custodia-asistida)
5. [Trustlines](#5-trustlines)
6. [Escrow on-chain](#6-escrow-on-chain)
7. [Soroban : contratos inteligentes](#7-soroban--contratos-inteligentes)
8. [Auditoría inmutable](#8-auditoría-inmutable)
9. [Stellar SDK (JavaScript/TypeScript)](#9-stellar-sdk-javascripttypescript)
10. [Trustless Work : escrow como servicio](#10-trustless-work--escrow-como-servicio)
11. [Flujo completo on-chain paso a paso](#11-flujo-completo-on-chain-paso-a-paso)
12. [Glosario rápido](#12-glosario-rápido)

---

## 1. ¿Qué es Web3 y por qué VELAR lo usa?

**Web3** es el paradigma donde los datos críticos de una aplicación no viven solo en una base de datos centralizada, sino en una **blockchain pública y verificable** por cualquier persona.

En VELAR el problema central es la **confianza**: ¿quién es realmente el dueño de un bono político? ¿Cambió de manos correctamente? ¿El TSE puede verificarlo sin depender de que nadie altere un registro en Postgres?

La respuesta es registrar la propiedad del bono **directamente en la blockchain de Stellar**. Una vez que el token está ahí, ningún servidor, base de datos ni administrador puede alterar ese historial. Es la fuente de verdad.

---

## 2. Stellar : la blockchain elegida

**Stellar** es una blockchain de capa 1 diseñada para movimiento de activos digitales con:

- **Finality en ~5 segundos** : las transacciones son definitivas, sin reorganizaciones.
- **Fees mínimos** : fracciones de centavo por operación (no hay gas fees impredecibles).
- **Activos nativos** : cualquier cuenta puede emitir y transferir activos sin necesidad de contratos (a diferencia de Ethereum, donde ERC-20 requiere Solidity).
- **Soroban** : entorno de contratos inteligentes basado en WebAssembly (Rust), añadido en 2024.

VELAR usa Stellar Testnet para desarrollo y Stellar Mainnet como destino de producción.

**Explorador público:** [`stellar.expert/explorer/testnet`](https://stellar.expert/explorer/testnet)

### ¿Por qué Stellar y no Ethereum?

| Criterio | Stellar | Ethereum |
|---|---|---|
| Velocidad de confirmación | ~5 s | 12-15 s (pos) |
| Costo por transacción | < $0.001 | $0.10 – $50+ |
| Activos nativos (sin contrato) | ✅ | ❌ (requiere ERC-20) |
| Orientado a pagos institucionales | ✅ | Parcial |
| Soporte de contratos inteligentes | ✅ (Soroban) | ✅ (Solidity) |

---

## 3. Tokens / Activos nativos de Stellar

En Stellar, cualquier cuenta puede **emitir un activo** simplemente especificando un código y la cuenta emisora. No se necesita un contrato.

### Cómo funciona el bono como token

```
Activo: BOND-abc123   (código único por bono)
Emisor: cuenta TSE    (la que lo creó)
Cantidad total: 1     (no divisible  a  único, como un NFT)
```

- **Emitir** = el TSE firma una transacción que crea el activo y lo acredita a la cuenta del partido.
- **Transferir** = operación `Payment` en Stellar: mueve el token de una cuenta a otra.
- **"Ser dueño" = tener el token** en tu cuenta de Stellar. No hay base de datos que diga quién es el dueño; la blockchain lo determina.

### ¿Por qué cantidad 1 y no divisible?

Un bono físico es único : no existe medio bono. En Stellar se logra creando el activo con `asset_type: credit_alphanum12`, emitiendo exactamente `1` unidad y desactivando la capacidad de volver a emitir más. Esto lo hace funcionalmente idéntico a un NFT.

---

## 4. Wallets y custodia asistida

Una **wallet** en Stellar es simplemente un par de llaves criptográficas:

- **Clave pública** (`G...`) : es la "dirección", visible para todos.
- **Clave privada** (`S...`) : firma transacciones; quien la tiene controla la cuenta.

### Problema: usuarios no técnicos

El TSE, los partidos y los compradores no deben aprender a manejar llaves privadas, instalar Freighter ni guardar seedphrases. Cualquier fricción aquí destruye la adopción institucional.

### Solución: wallets de custodia (Custodial Wallets)

VELAR crea y administra las wallets **en nombre de cada actor**:

```
Backend (NestJS)
  ├── wallet_platform      a  opera el sistema, paga fees
  ├── wallet_tse           a  firma emisiones de bonos
  ├── wallet_partido_X     a  recibe/vende bonos del partido X
  ├── wallet_usuario_Y     a  compra/vende bonos del usuario Y
  └── wallet_escrow_Z      a  custodia temporal durante traspasos
```

Las llaves privadas viven en variables de entorno del servidor (`.env`). En producción deben guardarse en un **HSM** o servicio de gestión de llaves (AWS KMS, Azure Key Vault, etc.).

**Ventaja:** el usuario interactúa con una UI normal (login, botones). No ve llaves, no paga fees directamente.
**Compromiso:** el backend tiene custodia; si el servidor se compromete, las wallets se comprometen. Mitigable con HSM + multisig.

---

## 5. Trustlines

En Stellar, una cuenta no puede recibir un activo hasta que **establece una trustline**: una declaración explícita de que confía en ese activo.

```
wallet_partido.changeTrust({ asset: BOND-abc123, limit: "1" })
```

VELAR gestiona las trustlines automáticamente antes de cada transferencia:

1. Antes de emitir un bono  a  el backend verifica / crea la trustline del partido.
2. Antes de liberar el escrow  a  verifica la trustline del comprador.

Esto evita transacciones fallidas por trustline faltante : uno de los errores más comunes al trabajar con activos Stellar.

---

## 6. Escrow on-chain

**Escrow** es un mecanismo donde un tercero custodia un activo hasta que se cumple una condición. En VELAR, la condición es la confirmación del pago físico.

### Escrow clásico en Stellar (cuenta intermedia)

```
1. Vendedor firma  a  token va a cuenta_escrow (bloqueada con multisig)
2. Comprador registra pago (hash del comprobante)
3. Vendedor confirma  a  cuenta_escrow firma el release  a  token va al comprador
```

La cuenta de escrow se configura con **múltiples firmantes requeridos** (multisig), de modo que ni el vendedor ni el comprador puedan mover el token unilateralmente mientras está en custodia.

### Escrow vía Trustless Work

Para escrows más robustos, VELAR integra **Trustless Work**, una API que despliega contratos Soroban de escrow sobre Stellar. El token queda en un contrato inteligente en lugar de una cuenta intermedia, lo que elimina la necesidad de que el backend sea un firmante del escrow.

---

## 7. Soroban : contratos inteligentes

**Soroban** es el entorno de contratos inteligentes de Stellar, introducido en 2024. Los contratos se escriben en **Rust**, se compilan a **WebAssembly (WASM)** y se ejecutan en la propia blockchain.

### Contrato `VelarBond` (en `contracts/velar-bond/`)

VELAR tiene su propio contrato Soroban que representa un bono individual con **toda su metadata on-chain**:

```rust
pub struct VelarBond {
    pub bond_id:            String,   // ID interno
    pub certificate_number: String,   // número de certificado físico
    pub series:             String,   // serie del bono
    pub amount:             i128,     // valor en colones
    pub party_id:           String,   // partido emisor
    pub owner:              Address,  // dueño actual (Address de Stellar)
    pub status:             BondStatus, // Active / Transferred / Frozen
    pub issued_at:          u64,      // timestamp de emisión
    pub expires_at:         u64,      // vencimiento
    pub document_hash:      String,   // SHA-256 del documento físico
}
```

**Funciones del contrato:**
- `initialize(tse, data)` : despliega y configura el bono
- `transfer(from, to)` : transfiere propiedad (solo el dueño puede llamarla)
- `freeze(authority)` : congela el bono (solo TSE)
- `get_owner()` : consulta el dueño actual

### Cómo funciona el deploy por bono

Cada bono tiene su **propio contrato desplegado** (una instancia nueva por bono). Esto significa que la metadata de cada bono está en la blockchain, con su `contractId` único.

```typescript
// SorobanBondService.deployBond()
const contractId = await sorobanService.deployBond({
  partyOwner: "GABC...",
  partyId:    "uuid-partido",
  bondId:     "uuid-bono",
  // ...
});
// contractId se guarda en bonds.soroban_contract_id
```

### Modo dual (compatibilidad)

El sistema tiene **dos modos**:
- **Con Soroban** (`SOROBAN_VELAR_BOND_WASM_HASH` definido): despliega un contrato por bono + activo Classic.
- **Sin Soroban** (por defecto en dev): solo Classic Assets de Stellar (más simple, compatible con el stack existente).

---

## 8. Auditoría inmutable

Toda acción relevante genera un **evento de auditoría** que se guarda en la tabla `audit_events` de Postgres con política `append-only` (no se puede actualizar ni borrar mediante RLS de Supabase):

```sql
CREATE TABLE audit_events (
  id          uuid DEFAULT gen_random_uuid(),
  bond_id     uuid REFERENCES bonds(id),
  actor_id    uuid REFERENCES users(id),
  action      text,         -- 'issued', 'transfer_requested', 'released', ...
  metadata    jsonb,        -- datos adicionales del evento
  tx_hash     text,         -- hash de la transacción Stellar (si aplica)
  created_at  timestamptz DEFAULT now()
);
```

Además, cada transacción on-chain tiene su **hash de Stellar** : un identificador criptográfico único que permite verificar la operación en el explorador público, independientemente de VELAR.

**Doble capa de auditoría:**
1. `audit_events` en Postgres  a  rápido de consultar, accesible para el TSE desde la UI.
2. Transacciones en Stellar  a  inmutable, verificable públicamente sin depender de VELAR.

---

## 9. Stellar SDK (JavaScript/TypeScript)

VELAR usa [`@stellar/stellar-sdk`](https://stellar.github.io/js-stellar-sdk/) v15 para todas las operaciones on-chain.

### Operaciones más usadas

```typescript
import {
  Keypair,
  Asset,
  TransactionBuilder,
  Operation,
  Networks,
  rpc,         // para Soroban
  Contract,    // para contratos Soroban
  nativeToScVal,
  scValToNative,
} from '@stellar/stellar-sdk';

// Crear un activo
const asset = new Asset('BOND-abc123', issuerPublicKey);

// Operación de pago (transferir el token)
Operation.payment({ destination, asset, amount: '1' });

// Operación changeTrust (trustline)
Operation.changeTrust({ asset, limit: '1' });

// Operación de cambio de firmantes (multisig para escrow)
Operation.setOptions({ signer: { ed25519PublicKey: ..., weight: 1 } });

// Construir y firmar transacción
const tx = new TransactionBuilder(sourceAccount, { fee, networkPassphrase })
  .addOperation(op)
  .setTimeout(30)
  .build();
tx.sign(keypair);
```

---

## 10. Trustless Work : escrow como servicio

[**Trustless Work**](https://trustless.work) es una API construida sobre Stellar/Soroban que abstrae la lógica de escrow:

- Despliega contratos Soroban de escrow bajo demanda (vía API REST).
- El token queda en el contrato, no en una cuenta que el backend controla.
- El release requiere la firma de múltiples partes (comprador + vendedor), sin que VELAR sea el árbitro único.

### Cómo lo usa VELAR

```typescript
// EscrowService crea un escrow en Trustless Work
const escrow = await trustlessWork.createEscrow({
  receiver: compradorAddress,
  amount:   bondAmount,
  token:    bondAssetCode,
});

// Al confirmar el pago, se libera el escrow
await trustlessWork.releaseEscrow({ escrowId });
```

El `escrowAddress` del contrato Soroban se guarda en `transfers.escrow_address`.

---

## 11. Flujo completo on-chain paso a paso

```
┌─────────────────────────────────────────────────────────────────────┐
│                        STELLAR TESTNET                              │
│                                                                     │
│  [TSE emite bono]                                                   │
│    TSE_wallet ──changeTrust──► BOND-abc123                          │
│    TSE_wallet ──payment(1)───► PARTIDO_wallet                       │
│                                                                     │
│  [Partido pone en venta  a  Usuario solicita compra]                  │
│    (solo en DB : no hay tx on-chain todavía)                        │
│                                                                     │
│  [Partido acepta  a  bono entra a escrow]                             │
│    PARTIDO_wallet ──payment(1)───► ESCROW_wallet 🔒                 │
│    (multisig: necesita firma del backend para salir)                │
│                                                                     │
│  [Usuario registra pago]                                            │
│    (se guarda hash del comprobante en DB)                           │
│                                                                     │
│  [Partido confirma  a  bono sale a usuario]                           │
│    ESCROW_wallet ──payment(1)───► USUARIO_wallet 🎉                 │
│                                                                     │
│  Cada ── es una transacción real, con tx_hash verificable           │
└─────────────────────────────────────────────────────────────────────┘
```

**Con Soroban activo**, el token del escrow vive en un contrato inteligente en lugar de `ESCROW_wallet`, y el release lo ejecuta el contrato mismo al recibir la firma de confirmación.

---

## 12. Glosario rápido

| Término | Significado en VELAR |
|---|---|
| **Blockchain** | Registro distribuido e inmutable de transacciones |
| **Stellar** | La blockchain que usa VELAR para mover los bonos |
| **Testnet** | Red de pruebas de Stellar (sin valor real) |
| **Asset / Token** | El bono representado como activo nativo de Stellar |
| **Wallet** | Par de llaves criptográficas que controla una cuenta Stellar |
| **Custodia asistida** | El backend crea y administra las wallets por el usuario |
| **Trustline** | Permiso explícito para recibir un activo en Stellar |
| **Escrow** | Cuenta/contrato que bloquea el token hasta que se confirma el pago |
| **Multisig** | Cuenta que requiere múltiples firmas para operar |
| **Soroban** | Entorno de contratos inteligentes de Stellar (Rust  a  WASM) |
| **Contract ID** | Dirección única de un contrato desplegado en Soroban |
| **tx_hash** | Identificador criptográfico de una transacción (verificable públicamente) |
| **WASM** | WebAssembly : formato de bytecode que ejecutan los contratos Soroban |
| **RLS** | Row Level Security de Postgres (usado en Supabase para `audit_events`) |
| **Trustless Work** | API de escrow sobre Soroban, usada como servicio externo |
| **NFT institucional** | Activo único no divisible (cantidad 1) : equivalente funcional de un NFT |
| **Classic Asset** | Activo Stellar sin contrato (el modo por defecto de VELAR) |
| **Keypair** | Par clave pública + privada que identifica y autoriza una cuenta |
| **Finality** | Confirmación irreversible de una transacción (~5s en Stellar) |

---

> Para ver el token moverse en tiempo real, levanta el proyecto y abre [`stellar.expert/explorer/testnet`](https://stellar.expert/explorer/testnet) mientras ejecutas `npm run demo:flow`.
