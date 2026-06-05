# VELAR

**Infraestructura blockchain para el traspaso digital de propiedad de bonos de partidos políticos.**

> Trazabilidad, custodia y auditoría en tiempo real sobre Stellar — para el TSE, partidos y ciudadanos.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| ![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=flat&logo=next.js&logoColor=white) | Frontend (App Router) |
| ![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat&logo=nestjs&logoColor=white) | API REST + WebSocket |
| ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white) | Lenguaje en toda la plataforma |
| ![Stellar](https://img.shields.io/badge/Stellar-7D00FF?style=flat&logo=stellar&logoColor=white) | Blockchain — activos, escrow, historial |
| ![Soroban](https://img.shields.io/badge/Soroban_Smart_Contracts-7D00FF?style=flat&logo=stellar&logoColor=white) | Contratos inteligentes por bono |
| ![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white) | Auth + Postgres (cache, roles) |
| ![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS_v4-06B6D4?style=flat&logo=tailwindcss&logoColor=white) | Estilos |
| ![Rust](https://img.shields.io/badge/Rust-000000?style=flat&logo=rust&logoColor=white) | Contratos Soroban (`contracts/velar-bond`) |

---

## ¿Qué es VELAR?

Hoy los bonos de partidos políticos se traspasan en papel: sin control de quién es el dueño, sin historial verificable, sin trazabilidad para el TSE. **VELAR lo digitaliza.**

Cada bono es un **token único en la blockchain de Stellar** (análogo a un NFT institucional). La propiedad, el escrow durante el traspaso y todo el historial de cambios de dueño viven on-chain — verificables por cualquier persona, en tiempo real.

---

## Las tres perspectivas

| Actor | Rol | Capacidades |
|---|---|---|
| 🏛️ **TSE** | Autoridad fiscalizadora | Emite bonos, supervisa todos los traspasos, audita historial, puede congelar |
| 🎗️ **Partido** | Emisor / Vendedor | Recibe bonos emitidos, los pone en venta, confirma pagos |
| 👤 **Usuario** | Comprador / Recomprador | Compra bonos al partido o a otros usuarios, revende |

---

## El flujo completo

```
1. TSE emite el bono  ────────────────►  a nombre de un PARTIDO  (token minteado en Stellar)
2. El PARTIDO pone el bono en venta
3. Un USUARIO solicita comprarlo
4. El dueño ACEPTA  ──────────────────►  el token entra a ESCROW (bloqueado on-chain) 🔒
5. El comprador registra el PAGO (hash del comprobante físico)
6. El vendedor CONFIRMA el pago  ──────►  el token pasa al nuevo dueño 🎉
```

Cada paso queda como una **transacción inmutable en Stellar**, auditable en [`stellar.expert`](https://stellar.expert/explorer/testnet).

---

## Arquitectura del monorepo

```
VELAR/
├── apps/
│   ├── api/          # NestJS — lógica de negocio + integración Stellar/Soroban
│   └── web/          # Next.js — UI para TSE, partidos y usuarios
├── contracts/
│   └── velar-bond/   # Contrato Soroban en Rust (metadata on-chain por bono)
├── packages/
│   └── types/        # Tipos TypeScript compartidos
├── supabase/
│   └── migrations/   # Esquema de base de datos
└── docs/             # Documentación técnica detallada
```

---

## Cómo los bonos viven en blockchain

- Cada bono es un **Classic Asset de Stellar** (cantidad `1`, no divisible) — único por diseño, como un NFT pero sin gas fees prohibitivos.
- **Opcionalmente**, cada bono tiene un **contrato Soroban** individual con toda su metadata on-chain (monto, fechas, certificado, partido, estado).
- **"Ser dueño del bono" = tener ese token en una cuenta de Stellar.** No hay base de datos que lo diga: la blockchain es la fuente de verdad.
- Cada actor tiene una **wallet de custodia** creada y administrada por el backend — el usuario nunca maneja llaves privadas ni crypto.
- El **escrow** es una cuenta Stellar separada donde el token queda bloqueado (multisig) durante el proceso de traspaso.
- El **pago es externo** (fiat / físico): solo se registra el hash SHA-256 de su comprobante.

---

## Cómo correrlo

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp apps/api/.env.example apps/api/.env
# Editar con tus claves de Supabase

# 3. Crear wallets de custodia en testnet
cd apps/api
npm run provision:wallets

# 4. Sembrar datos de demo
npm run seed

# 5. Levantar la API
npm run start        # → http://localhost:3001/api

# 6. Levantar el frontend (en otra terminal)
cd ../web
npm run dev          # → http://localhost:3000
```

### Probar sin frontend

El backend sirve una **consola web** con flujo de un clic:

```
http://localhost:3001/api/console
```

O por terminal:

```bash
npm run demo:flow         # flujo completo con cuentas sembradas
npm run demo:register     # registra partido + usuario nuevos y corre el flujo
```

---

## Endpoints principales (prefijo `/api`)

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/auth/register` | Registro (rol `usuario` o `partido`) |
| `GET` | `/bonds` | Todos los bonos |
| `GET` | `/bonds/available` | Bonos disponibles para compra |
| `POST` | `/bonds` | Emitir bono (TSE) |
| `GET` | `/bonds/:id/onchain` | Estado on-chain del bono |
| `POST` | `/transfers` | Solicitar compra |
| `PATCH` | `/transfers/:id/accept` | Aceptar → entra a escrow |
| `PATCH` | `/transfers/:id/payment` | Registrar pago |
| `PATCH` | `/transfers/:id/release` | Confirmar pago → liberar token |
| `PATCH` | `/transfers/:id/cancel` | Cancelar transferencia |
| `GET` | `/users/me` | Perfil propio |
| `GET` | `/parties` | Lista de partidos |

---

## Documentación

| Documento | Contenido |
|---|---|
| [`docs/WEB3.md`](docs/WEB3.md) | Conceptos Web3 aplicados: Stellar, Soroban, escrow, wallets, tokens |
| [`docs/DEMO.md`](docs/DEMO.md) | Cómo levantar, probar y ver el token moverse |
| [`docs/BACKEND.md`](docs/BACKEND.md) | Arquitectura y módulos del backend |
| [`docs/FRONTEND_GUIDE.md`](docs/FRONTEND_GUIDE.md) | Contrato de API para el equipo de frontend |
| [`docs/AGENTS.md`](docs/AGENTS.md) | Reglas para agentes de IA que trabajen en el repo |

---

> Testnet / demo. Las wallets son de custodia sin dinero real. No usar en producción sin auditoría de seguridad.
