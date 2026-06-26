![VELAR](docs/banner.png)

# VELAR

**Infraestructura blockchain para el traspaso digital de propiedad de bonos de partidos políticos.**

> Trazabilidad, custodia y auditoría en tiempo real sobre Stellar — para el TSE, partidos y ciudadanos.

[![CI](https://github.com/Velar-Bonds/Velar/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/Velar-Bonds/Velar/actions/workflows/ci.yml)

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/template)

---

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=flat&logo=next.js&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat&logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Stellar](https://img.shields.io/badge/Stellar-7D00FF?style=flat&logo=stellar&logoColor=white)
![Soroban](https://img.shields.io/badge/Soroban_Smart_Contracts-7D00FF?style=flat&logo=stellar&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS_v4-06B6D4?style=flat&logo=tailwindcss&logoColor=white)
![Rust](https://img.shields.io/badge/Rust-000000?style=flat&logo=rust&logoColor=white)

</div>

---

## El problema

En Costa Rica, los bonos de deuda de partidos políticos se traspasan en papel, sin registro verificable. No hay un registro público de quién es el dueño actual, cuántas veces cambió de manos ni a qué precio. El TSE no tiene visibilidad en tiempo real sobre estas operaciones, y los compradores no tienen garantías de transparencia.

**El resultado:** un mercado opaco donde la información depende de documentos físicos y la buena fe de las partes.

---

## La solución

VELAR convierte cada bono en un **token único en la blockchain de Stellar** — como un NFT institucional. La propiedad, el escrow durante el traspaso y todo el historial de cambios de dueño quedan registrados de forma **pública, inmutable y verificable** por cualquier persona.

---

## Tres actores, un flujo

| Actor | Rol en VELAR |
|---|---|
| **TSE** (Tribunal Supremo de Elecciones) | Emite bonos, supervisa traspasos, audita el historial completo, puede congelar |
| **Partido político** | Recibe bonos emitidos a su nombre, los pone en venta, confirma pagos |
| **Usuario / Comprador** | Compra bonos al partido o a otros usuarios, revende con trazabilidad completa |

---

## El flujo en 6 pasos

```
1. TSE emite el bono ────────────► Token minteado en Stellar, enviado al PARTIDO
2. PARTIDO publica el bono ──────► Visible en el marketplace
3. USUARIO solicita comprar ─────► Oferta registrada (con monto negociable)
4. PARTIDO acepta ───────────────► Token entra al ESCROW on-chain 🔒 (bloqueado)
5. USUARIO registra el pago ─────► Hash del comprobante físico guardado on-chain
6. PARTIDO confirma el pago ─────► Token liberado al nuevo dueño 🎉
```

Cada paso genera una **transacción inmutable en Stellar**, auditable públicamente en [stellar.expert](https://stellar.expert/explorer/testnet).

---

## Cómo funciona cada tecnología

### Stellar — la blockchain

[Stellar](https://stellar.org) es una blockchain de capa 1 diseñada para movimiento de activos digitales. VELAR la eligió por tres razones:

- **Activos nativos sin contrato**: cualquier cuenta puede emitir un activo único (cantidad `1`, no divisible) sin necesidad de escribir código. Cada bono es un activo así — funcionalmente idéntico a un NFT pero sin gas fees.
- **Finality en ~5 segundos**: las transacciones son definitivas, sin reorganizaciones de bloque.
- **Fees mínimos**: fracciones de centavo por operación (no hay costos impredecibles como en Ethereum).

**"Ser dueño del bono" = tener ese token en una cuenta Stellar.** No hay base de datos que lo declare: la blockchain es la fuente de verdad.

---

### Soroban — contratos inteligentes en Rust

[Soroban](https://soroban.stellar.org) es el entorno de contratos inteligentes de Stellar, introducido en 2024. Los contratos se escriben en **Rust**, se compilan a **WebAssembly** y se ejecutan directamente en la blockchain.

VELAR tiene su propio contrato `VelarBond` (`contracts/velar-bond/`). Cada bono emitido puede tener **su propio contrato desplegado** con toda la metadata on-chain:

```rust
pub struct BondDetails {
    pub bond_id:            String,    // ID interno del bono
    pub party_id:           String,    // partido emisor
    pub certificate_number: String,    // número de certificado físico
    pub face_value:         i128,      // valor en colones
    pub interest_rate_bps:  u32,       // tasa de interés (basis points)
    pub maturity_date:      u64,       // vencimiento (unix timestamp)
    pub document_hash:      BytesN<32>,// SHA-256 del PDF del certificado
    pub current_owner:      Address,   // dueño actual (verificable on-chain)
    pub status:             Status,    // Active / InEscrow / Frozen / Sold
}
```

**Funciones del contrato:** `initialize`, `transfer`, `freeze/unfreeze`, `set_in_escrow/set_active`, `details`, `current_owner`, `status`.

Si `SOROBAN_VELAR_BOND_WASM_HASH` no está configurado, el sistema usa solo Classic Assets (modo por defecto en desarrollo).

---

### Trustless Work — escrow como servicio

[Trustless Work](https://trustlesswork.com) es una API que despliega **contratos Soroban de escrow** sobre Stellar. Cuando un vendedor acepta una oferta:

1. VELAR llama a Trustless Work para crear un contrato escrow (Single-Release).
2. El token del bono entra al contrato y queda **bloqueado** hasta que se cumplan las condiciones.
3. Al confirmar el pago, el contrato libera el token al comprador y registra la transacción como `milestone approved`.

Esto deja una **huella pública on-chain** de todo el lifecycle del trade: `deployed → milestone completed → milestone approved`. Cualquier persona puede verificarlo abriendo el `escrow_contract_id` en [stellar.expert](https://stellar.expert/explorer/testnet).

---

### Supabase — autenticación e índice

Supabase maneja **solo dos cosas**:

1. **Auth**: usuarios, sesiones, JWTs. La clave `anon` solo se usa en el frontend para login/signup; todas las operaciones críticas las ejecuta el backend con la `service_role` key.
2. **Índice**: Postgres actúa como cache de lectura rápida para el frontend. Si Postgres se pierde, el estado real de los bonos se puede reconstruir desde Stellar.

La tabla `audit_events` es **append-only** por política RLS — no se puede actualizar ni borrar. Es el registro inmutable de todas las acciones del sistema.

---

### NestJS — el backend

El backend (`apps/api`) es un servidor [NestJS](https://nestjs.com) con TypeScript que actúa como intermediario entre el frontend y la blockchain:

- Valida JWTs de Supabase en cada request (`AuthGuard`)
- Firma transacciones Stellar usando las wallets custodiales del servidor
- Coordina el flujo de 6 pasos, emitiendo eventos de auditoría en cada acción
- Expone endpoints REST para TSE, partidos y compradores según su rol

**Módulos:** `bonds`, `transfers`, `escrow` (Stellar + Soroban + Trustless Work), `analytics`, `audit`, `parties`, `reports`, `explorer`.

---

### Next.js — el frontend

El frontend (`apps/web`) usa [Next.js](https://nextjs.org) 16 con App Router y [Tailwind CSS](https://tailwindcss.com) v4. Tiene tres shells visuales separados:

- **Shell del comprador** — marketplace, mis bonos, negociaciones, trazabilidad
- **Shell del partido** — mis bonos, solicitar bonos, negociaciones, reportes al TSE
- **Shell del TSE** — emisión, registros, revisión, analytics, auditoría, escrows, retiros

La autenticación y la protección de rutas corre en el middleware de Next.js (`middleware.ts`) contra Supabase.

---

## Arquitectura del monorepo

```
VELAR/
├── apps/
│   ├── api/                # NestJS: lógica de negocio + integración Stellar/Soroban/TW
│   └── web/                # Next.js: UI para TSE, partidos y compradores
├── contracts/
│   └── velar-bond/         # Contrato Soroban en Rust (VelarBond)
├── packages/
│   └── types/              # @velar/types: tipos TypeScript compartidos (fuente de verdad)
├── supabase/
│   └── migrations/         # Schema SQL versionado (append-only)
└── docs/                   # Documentación técnica detallada
    ├── AGENTS.md            # Reglas para contribuidores y agentes IA
    ├── BACKEND.md           # Estado del backend
    ├── FRONTEND_GUIDE.md    # Guía del frontend
    ├── SOROBAN.md           # Contratos Soroban
    ├── WEB3.md              # Conceptos Web3 aplicados
    └── DEMO.md              # Cómo probar el flujo completo
```

---

## Cómo correrlo

**Requisitos:** Node.js 22+ (Node 20 no funciona con el cliente de Supabase).

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
# Editar con tus claves de Supabase

# 3. Levantar API y frontend en paralelo
npm run dev
# API en http://localhost:3001/api
# Web en http://localhost:3000
```

### Probar sin frontend

El backend incluye una consola HTML con botones para ejecutar el flujo completo:

```
http://localhost:3001/api/console
```

O desde la terminal:

```bash
npm run demo:flow         # flujo completo con cuentas sembradas
npm run demo:register     # crea partido + usuario nuevos y corre el flujo
```

---

## Contribuir

Ver [CONTRIBUTING.md](CONTRIBUTING.md) y el [ROADMAP.md](ROADMAP.md) para saber qué tareas están abiertas.

---

> Testnet / demo. Las wallets son de custodia sin dinero real. No usar en producción sin auditoría de seguridad.
