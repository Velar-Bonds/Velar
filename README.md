# ⛓️ VELAR

**Infraestructura blockchain para el traspaso digital de propiedad de bonos comprados a partidos políticos.**

Cada bono es un **token real en Stellar**. La propiedad, el escrow y el historial de traspasos viven en la blockchain; el TSE puede fiscalizar todo en tiempo real. Supabase se usa **solo para autenticación**.

---

## 🎯 El problema
Hoy los bonos de partidos políticos se traspasan en papel: no hay control claro de quién es el dueño, quién lo tuvo antes, ni trazabilidad para el TSE. VELAR lo digitaliza con un token único por bono y un registro inmutable en blockchain.

## 🧩 Stack
- **Frontend:** Next.js (App Router) — `apps/web` *(lo desarrolla el equipo de frontend)*
- **Backend:** NestJS — `apps/api`
- **Auth:** Supabase Auth (login + roles)
- **Blockchain:** Stellar (testnet) — el bono es un activo Stellar único; custodia asistida
- **Tipos compartidos:** `packages/types`

## 👥 Las 3 perspectivas

| Perspectiva | Rol | Qué hace |
|---|---|---|
| 🏛️ **TSE** | autoridad | **Emite** los bonos **a nombre de un partido**. Supervisa y audita: ve todos los bonos, sus dueños, su info y todas las transacciones. Puede congelar bonos. |
| 🎗️ **Partido** | emisor | Recibe los bonos emitidos a su nombre y **los pone en venta**. Acepta solicitudes de compra y confirma el pago. |
| 👤 **Usuario** | comprador / recomprador | **Compra** bonos al partido y **revende** a otros usuarios. Comprador y recomprador son el mismo tipo de usuario. |

## 🔄 El flujo completo

```
1. TSE emite el bono  ─────────────►  a nombre de un PARTIDO  (token minteado en Stellar)
2. El PARTIDO lo pone en venta
3. Un USUARIO ve el bono y SOLICITA comprarlo
4. El dueño (partido o usuario) ACEPTA  ──►  el token entra a la CANASTA (escrow) 🔒
5. El comprador registra el PAGO físico  (se guarda el hash de la evidencia)
6. El vendedor CONFIRMA el pago  ──►  el token sale de la canasta al nuevo dueño 🎉
```

Cada paso queda registrado: el cambio de dueño es una **transacción real en Stellar**, y además se guarda un **evento de auditoría inmutable**.

## 🪙 ¿Cómo funcionan los tokens?

- El bono se emite como un **activo nativo de Stellar** (cantidad **1**, no divisible → único, como un NFT). No se usa Solidity ni OpenZeppelin: Stellar crea y mueve activos de forma nativa.
- **"Ser dueño del bono" = tener ese token en una cuenta de Stellar.**
- Cada dueño (partido, usuario) tiene una **wallet de custodia** que el backend crea y administra automáticamente (el usuario no maneja llaves ni dinero).
- La **canasta (escrow)** es otra cuenta de Stellar donde el token queda bloqueado durante el traspaso.
- **Transferir = mover el token**: dueño → canasta → nuevo dueño, todo on-chain y verificable en [stellar.expert](https://stellar.expert/explorer/testnet).
- El **pago es físico/externo** (no hay dinero on-chain): solo se registra el hash de su comprobante.

## 🗄️ Datos
- **Supabase (Postgres):** solo autenticación + perfiles/roles + índice de lectura para búsquedas.
- **Stellar:** la propiedad del bono y su historial de traspasos (la fuente de verdad on-chain).
- **Auditoría:** tabla `audit_events` **append-only** (no se puede editar ni borrar).

## 🚀 Cómo correrlo

```bash
npm install

# Configurar apps/api/.env (ver apps/api/.env.example) con las claves de Supabase.
cd apps/api
npm run provision:wallets   # crea las wallets de custodia (plataforma, escrow, demo) en testnet
npm run seed                # usuarios, partido y bonos de demostración
npm run start               # API en http://localhost:3001/api
```

## 👀 Probarlo sin frontend (sin login manual)

Hay una **consola web** servida por el backend:

```
http://localhost:3001/api/console
```

Botones de un clic para entrar como **TSE**, **Partido** o **Usuario** y correr todo el flujo, viendo el token moverse en Stellar.

O por línea de comandos:
```bash
npm run demo:flow        # flujo completo con cuentas sembradas
npm run demo:register    # registra un partido y un usuario nuevos y corre el flujo
```

## 📚 Documentación
- `docs/DEMO.md` — cómo levantar, probar y ver el funcionamiento.
- `docs/BACKEND.md` — arquitectura y estado del backend.
- `docs/FRONTEND_GUIDE.md` — contrato de la API para el equipo de frontend.
- `docs/AGENTS.md` — reglas para agentes de IA que trabajen en el repo.

## 🔌 Endpoints principales (API, prefijo `/api`)
- `POST /auth/register` — registro (perspectiva `usuario` o `partido`) con info completa.
- `GET  /bonds` · `GET /bonds/available` · `POST /bonds` (TSE) · `GET /bonds/:id/onchain`
- `POST /transfers` (comprador solicita) · `PATCH /transfers/:id/{accept,payment,release,cancel}`
- `GET  /users/me` · `GET /parties`

> Testnet / demo: las wallets son de custodia y sin dinero real. No usar en producción tal cual.
