# AGENTS.md — Reglas para agentes de IA trabajando en VELAR

> **Léelo completo antes de tocar nada.** Este repo se construye en parte con agentes de IA.
> Estas reglas existen para que NO se rompa lo que ya funciona. Si vas a hacer algo que
> contradiga este documento, **pará y preguntá al humano primero**.

---

## 0. Qué es VELAR (contexto en 30 segundos)

Plataforma para tokenizar y trazar la propiedad de **bonos comprados a partidos políticos**,
con auditoría en tiempo real para el **TSE** (Tribunal Supremo de Elecciones de Costa Rica).

**Cada bono es un TOKEN REAL en Stellar (testnet):** un activo único (cantidad 1). Tener el bono
= tener ese token en la cuenta de custodia del dueño. Las transferencias mueven el token a una
**cuenta de escrow (la "canasta")** que lo bloquea hasta confirmar el pago (que es **físico/externo**),
y luego lo libera al nuevo dueño. La propiedad y la historia viven en la **blockchain**.
**Supabase = solo auth.** Todo evento crítico queda además en un registro de auditoría inmutable.

Para verlo funcionar: `docs/DEMO.md` (`npm run demo:flow`).

## 1. Stack y estructura (NO lo cambies)

Monorepo con **npm workspaces**:

```
VELAR/
├── apps/
│   ├── api/        → Backend NestJS (TypeScript). DUEÑO: agente de backend.
│   └── web/        → Frontend Next.js (App Router + Tailwind). DUEÑO: agente de frontend.
├── packages/
│   └── types/      → @velar/types. Tipos compartidos entre api y web. FUENTE DE VERDAD.
└── supabase/
    └── migrations/ → Schema SQL (Postgres). Versionado, append-only.
```

- **Base de datos + Auth:** Supabase (Postgres + Supabase Auth).
- **Escrow on-chain:** Trustless Work (https://docs.trustlesswork.com) sobre Stellar.
- **Node:** se requiere Node 22+ (ver §6, bug de WebSocket en Node 20).

## 2. Regla de oro: división de responsabilidades

| Carpeta | Dueño | Otros agentes |
|---|---|---|
| `apps/api/**` | Agente **backend** | NO editar lógica. Solo leer para integrar. |
| `apps/web/**` | Agente **frontend** | NO editar. |
| `packages/types/**` | **Compartido** | Cambios SOLO por acuerdo; afecta a ambos. |
| `supabase/migrations/**` | Agente **backend** | NO modificar migraciones ya aplicadas. |

**Si sos el agente de FRONTEND:** tu guía completa está en `docs/FRONTEND_GUIDE.md`.
NO toques `apps/api`, `supabase/` ni la lógica de `packages/types`. Consumí la API por HTTP.

**Si sos el agente de BACKEND:** tu estado y hoja de ruta están en `docs/BACKEND.md`.

## 3. Cosas que NUNCA debés hacer

1. **NO commitear secretos.** Los `.env` están en `.gitignore`. Solo se versionan `.env.example`.
   Nunca pongas claves reales (`SUPABASE_SERVICE_ROLE_KEY`, API keys) en código ni en docs.
2. **NO modificar una migración SQL ya aplicada.** Creá una migración nueva con timestamp mayor.
3. **NO permitir que el `audit_events` se pueda editar o borrar.** Es append-only por diseño
   (hay un trigger que lo bloquea). Es el corazón de la trazabilidad.
4. **NO usar el `service_role` key en el frontend.** Solo el backend lo usa. El frontend usa
   la `publishable`/`anon` key.
5. **NO permitir auto-asignación de roles privilegiados** (`admin`, `tse`, `validador`) en el
   signup. Ver §5.
6. **NO borrar ni reescribir lógica que ya funciona** para "limpiar". Si algo te parece mal,
   anotalo y preguntá.
7. **NO commitear archivos compilados** (`dist/`, `.next/`, `*.js` dentro de `apps/api/src/`).

## 4. Flujo de negocio (no lo rompas)

Estados del **bono**: `emitido → activo → en_escrow → transferido` (+ `cancelado`, `congelado`).
Estados de la **transferencia**:
`solicitada → aceptada → en_escrow → pago_registrado → pago_validado → liberada`
(+ `rechazada`, `cancelada`).

Flujo principal (cada paso emite un evento de auditoría):
1. **Emisor** registra el bono → token creado (`emitido`/`activo`).
2. **Dueño actual** solicita transferencia a un recomprador (`solicitada`).
3. **Recomprador** acepta → token al escrow, bono `en_escrow` (`aceptada`→`en_escrow`).
4. **Recomprador** registra evidencia de pago (hash) (`pago_registrado`).
5. **Validador** valida el pago (`pago_validado`).
6. **Validador** libera → bono cambia de dueño, queda `activo` (`liberada`).

Reglas duras:
- Un bono tiene **un solo dueño** a la vez.
- No se puede transferir si está `en_escrow`, `cancelado` o `congelado`.
- Toda acción crítica → evento en `audit_events`.
- El historial de propietarios **no se borra ni se modifica**.

## 5. Seguridad (crítico)

- **Auth:** el backend valida el JWT de Supabase en `AuthGuard` y carga el `profile` (con rol).
- **Autorización:** la lógica de roles vive en los services del backend. El frontend NO es
  fuente de verdad de permisos.
- **RLS:** las políticas Row Level Security existen para acceso directo desde el frontend.
  ⚠️ Cuidado con **recursión** en políticas sobre `profiles` que consultan `profiles`
  (causa "infinite recursion detected"). Usá una función `SECURITY DEFINER` o claims del JWT.
- **Signup:** el rol por defecto debe ser `comprador`. Los roles `admin/tse/validador/emisor`
  se asignan SOLO por un admin (endpoint `PATCH /api/users/:id/role`), nunca por el propio usuario.

## 6. Cómo correr el proyecto

```bash
# Desde la raíz
npm install
npm run dev            # levanta api (3001) y web (3000)
# o por separado:
npm run dev --workspace apps/api
npm run dev --workspace apps/web
```

Variables de entorno: copiá `apps/api/.env.example` → `apps/api/.env` y
`apps/web/.env.example` → `apps/web/.env.local`, y pedí las claves reales al humano.

⚠️ **Node 22+ requerido.** Con Node 20 el cliente de Supabase falla con
`Node.js 20 detected without native WebSocket support`. Si no podés subir de versión,
hay que instalar `ws` y hacer polyfill de `globalThis.WebSocket` antes de crear el cliente.

## 7. Definición de "terminado" para cualquier cambio

Antes de decir que algo está listo:
- [ ] `npm run build` pasa en el workspace que tocaste.
- [ ] `npm run lint` sin errores nuevos.
- [ ] El backend arranca sin crashear (`npm run dev --workspace apps/api`).
- [ ] No agregaste secretos al repo.
- [ ] No rompiste el flujo de §4 ni las reglas de §3.
- [ ] Hiciste commit con mensaje claro (sin force-push a `main`).

## 8. Si te bloqueás

No inventes datos ni claves. No simules integraciones sin marcarlas como TODO.
Dejá una nota en `docs/BACKEND.md` o `docs/FRONTEND_GUIDE.md` y preguntá al humano.
