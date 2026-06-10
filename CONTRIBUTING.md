# Contribuir a VELAR

Gracias por tu interés en contribuir. VELAR es infraestructura pública para tokenizar y trazar la propiedad de bonos políticos en Costa Rica, sobre la blockchain de Stellar. Tu contribución ayuda a construir transparencia institucional real.

---

## Índice

- [¿Qué es VELAR?](#qué-es-velar)
- [Cómo empezar](#cómo-empezar)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Flujo de contribución](#flujo-de-contribución)
- [Áreas de contribución](#áreas-de-contribución)
- [Convenciones de código](#convenciones-de-código)
- [Reglas críticas (no romper)](#reglas-críticas-no-romper)
- [Preguntas frecuentes](#preguntas-frecuentes)

---

## ¿Qué es VELAR?

VELAR convierte cada bono político en un token único en Stellar con trazabilidad pública. El problema que resuelve: en Costa Rica los bonos de partidos políticos se transfieren manualmente en papel, sin registro verificable. VELAR lo digitaliza.

**Tres actores principales:**

| Actor | Qué hace en VELAR |
|---|---|
| **TSE** (Tribunal Supremo de Elecciones) | Emite bonos, supervisa transferencias, audita el historial |
| **Partido político** | Recibe bonos, los pone en venta, confirma pagos |
| **Usuario/comprador** | Compra y revende bonos con trazabilidad completa |

**Flujo en 6 pasos:**
1. TSE emite el bono → token Stellar creado
2. Partido publica el bono en el marketplace
3. Usuario solicita comprar
4. Vendedor acepta → token va al escrow on-chain (Trustless Work)
5. Comprador registra evidencia de pago físico
6. Vendedor confirma → token liberado al comprador, bono cambia de dueño

---

## Cómo empezar

### Requisitos

- Node.js 22+ (obligatorio — Node 20 no funciona con el cliente de Supabase)
- Rust + `cargo` (solo si vas a trabajar en los contratos Soroban)
- Una cuenta de GitHub

### Instalación

```bash
git clone https://github.com/Velar-Bonds/Velar.git
cd Velar
npm install
```

### Variables de entorno

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

Pedí las credenciales de testnet al mantenedor o creá tu propio proyecto en [supabase.com](https://supabase.com) usando las migraciones de `supabase/migrations/`.

### Correr el proyecto

```bash
# Ambos servicios en paralelo (recomendado)
npm run dev

# Por separado
npm run dev --workspace apps/api   # API en http://localhost:3001
npm run dev --workspace apps/web   # Web en http://localhost:3000
```

### Consola de prueba (sin frontend)

El endpoint `/api/console` sirve un HTML con botones para probar el flujo completo sin usar la UI. Útil para debugging del backend.

---

## Estructura del proyecto

```
Velar/
├── apps/
│   ├── api/                  Backend NestJS (TypeScript)
│   │   └── src/
│   │       ├── auth/         JWT guard + decoradores
│   │       ├── bonds/        Emisión y gestión de bonos
│   │       ├── transfers/    Flujo de compra/venta
│   │       ├── escrow/       Stellar, Soroban y Trustless Work
│   │       ├── analytics/    Métricas para el TSE
│   │       ├── audit/        Registro de eventos inmutable
│   │       ├── parties/      Gestión de partidos políticos
│   │       ├── reports/      Reportes partido → TSE
│   │       └── explorer/     Endpoint público de estado on-chain
│   └── web/                  Frontend Next.js 16 (App Router)
│       ├── app/              Rutas por rol
│       │   ├── tse/          Shell del TSE
│       │   ├── partido/      Shell del partido
│       │   └── (raíz)        Shell del comprador
│       ├── components/       Componentes reutilizables
│       └── lib/              Helpers (auth, API, Stellar)
├── contracts/
│   └── velar-bond/           Contrato Soroban en Rust
├── packages/
│   └── types/                @velar/types — tipos compartidos (fuente de verdad)
└── supabase/
    └── migrations/           Schema SQL versionado
```

### Regla de propiedad

| Área | Quién puede tocar |
|---|---|
| `apps/api/**` | Contribuidores de backend |
| `apps/web/**` | Contribuidores de frontend |
| `packages/types/**` | Cualquiera, con cuidado — afecta ambos lados |
| `supabase/migrations/**` | Solo contribuidores de backend. **Nunca modificar una migración ya aplicada.** |
| `contracts/**` | Solo contribuidores de Rust/Soroban |

---

## Flujo de contribución

1. **Encontrá un issue** en el repositorio. Los issues etiquetados con `good first issue` son buenos puntos de entrada.

2. **Comentá en el issue** antes de empezar para evitar trabajo duplicado. El mantenedor te lo asignará.

3. **Creá un fork y una rama** con nombre descriptivo:
   ```bash
   git checkout -b feat/notifications-module
   # o
   git checkout -b fix/audit-missing-events
   ```

4. **Desarrollá tu cambio.** Antes de abrir el PR, verificá:
   - [ ] `npm run build --workspace apps/api` (o `apps/web`) pasa sin errores
   - [ ] `npm run lint --workspace apps/api` (o `apps/web`) sin errores nuevos
   - [ ] El backend arranca (`npm run dev --workspace apps/api`)
   - [ ] No agregaste secretos ni claves al repo
   - [ ] Si tocaste `packages/types`, actualizaste los tipos en ambos lados

5. **Abrí un Pull Request** hacia `main`. Incluí:
   - Descripción del cambio y por qué
   - Cómo probaste el cambio (pasos para reproducir)
   - Referencia al issue (`Closes #123`)

6. **Respondé el review.** El mantenedor puede pedir cambios. Es parte del proceso normal.

---

## Áreas de contribución

### Frontend (Next.js + Tailwind)

**Stack:** Next.js 16 App Router, Tailwind CSS v4, TypeScript, Supabase Auth

**Tareas disponibles (ver `ROADMAP.md` §1 y §2):**
- Reemplazar mock data por llamadas reales a la API (8 páginas)
- Notificaciones in-app (badge + panel desplegable)
- Panel de perfil y configuración de usuario
- Dashboard de portafolio del comprador
- Paginación en listados
- Tests de componentes y hooks

**Guía:** `docs/FRONTEND_GUIDE.md`

**Convención de llamadas a la API:**
```typescript
// Usar siempre apiFetch, no fetch directo
import { apiFetch } from '@/lib/api';
const data = await apiFetch(token, 'GET', '/bonds');
```

---

### Backend (NestJS + TypeScript)

**Stack:** NestJS, TypeScript, Supabase (Postgres), Stellar SDK

**Tareas disponibles (ver `ROADMAP.md` §1 y §2):**
- `NotificationsModule` completo
- Endpoint unificado de trazabilidad
- Eventos de auditoría faltantes
- Paginación en endpoints de lista
- Rate limiting con `@nestjs/throttler`
- Exportación CSV/PDF

**Guía:** `docs/BACKEND.md`

**Convención de módulos NestJS:**
```
src/
└── feature/
    ├── feature.module.ts
    ├── feature.controller.ts
    └── feature.service.ts
```

Cada módulo nuevo debe importarse en `app.module.ts`.

---

### Soroban / Rust

**Stack:** Soroban SDK, Rust, Stellar testnet

**Tareas disponibles (ver `ROADMAP.md` §3):**
- Completar tests en `contracts/velar-bond/src/test.rs`
- Agregar función `redeem()` al contrato `VelarBond`
- Nuevo contrato `VelarMarketplace`

**Cómo compilar:**
```bash
cd contracts/velar-bond
cargo build --target wasm32-unknown-unknown --release
```

**Documentación:** `docs/SOROBAN.md`

---

### Tipos compartidos (`@velar/types`)

El paquete `packages/types` define los tipos que usan tanto la API como el frontend. Es la fuente de verdad del contrato entre ambos lados.

**Cuándo tocar este paquete:**
- Al agregar un nuevo endpoint que necesita request/response types
- Al agregar un nuevo enum de estado (ej: `NotificationType`)
- Al extender un modelo existente (ej: agregar `kyc_status` a `Profile`)

**Regla:** nunca romper un tipo existente sin coordinar con los dos lados (api y web) en el mismo PR.

---

### Documentación

- `docs/AGENTS.md` — reglas para agentes de IA (no modificar sin acuerdo del mantenedor)
- `docs/BACKEND.md` — estado e instrucciones del backend
- `docs/FRONTEND_GUIDE.md` — guía del frontend
- `docs/SOROBAN.md` — guía de contratos
- `docs/WEB3.md` — nivel de descentralización y arquitectura Web3

Si agregás un feature nuevo, documentalo en el archivo correspondiente.

---

## Convenciones de código

### General

- TypeScript estricto. Sin `any` salvo casos justificados.
- Nombres en inglés para código, español para strings de UI.
- Sin comentarios que explican qué hace el código (el nombre lo dice). Solo comentarios de WHY cuando no es obvio.
- Sin `console.log` en producción.

### Frontend

- Componentes en `PascalCase.tsx`
- Páginas siempre tienen una función `export default` que retorna el shell + content
- El estado de autenticación viene siempre de `useSession()` o del `AppShell`
- No usar `fetch` directo — usar `apiFetch` de `lib/api.ts`
- Las clases de Tailwind van inline en el JSX, sin archivos CSS separados

### Backend

- Cada módulo en su propia carpeta con `module.ts`, `controller.ts`, `service.ts`
- Los errores se lanzan con `throw new BadRequestException()` o `NotFoundException()` (NestJS los serializa automáticamente)
- Toda acción crítica (emisión, transferencia, aprobación) debe emitir un evento en `audit_events` vía `AuditService.emit()`
- El `audit_events` es append-only. **Nunca actualizar ni borrar eventos ya escritos.**
- Usar `this.supabase.admin` para operaciones que requieren service role; `this.supabase.client(userJwt)` para operaciones con RLS del usuario

### SQL / Migraciones

- Archivos con timestamp: `YYYYMMDDHHMMSS_description.sql`
- **Nunca modificar una migración ya aplicada.** Creá una nueva.
- Toda tabla nueva necesita `created_at TIMESTAMPTZ DEFAULT now()` y `updated_at`

---

## Reglas críticas (no romper)

Estas reglas son no negociables:

1. **No commitear secretos.** Ni en código ni en comentarios. Los `.env` están en `.gitignore`.

2. **No modificar `audit_events` existentes.** Es el registro inmutable del sistema. Hay un trigger en la BD que lo protege.

3. **No usar el `service_role` key en el frontend.** Solo el backend puede usarlo.

4. **No permitir auto-asignación de roles privilegiados** (`admin`, `tse`, `validador`) en el signup. Solo un admin puede asignarlos.

5. **No borrar migraciones SQL aplicadas.** Siempre creá una migración nueva.

6. **No commitear archivos compilados** (`dist/`, `.next/`, archivos `.js` dentro de `apps/api/src/`).

---

## Preguntas frecuentes

**¿Necesito acceso a Stellar mainnet?**
No. El desarrollo se hace en testnet. Friendbot fondea las wallets automáticamente.

**¿Necesito tener Rust instalado?**
Solo si vas a trabajar en los contratos Soroban. Para frontend y backend es suficiente con Node 22+.

**¿Cómo sé si mi PR está bien?**
Cumplí el checklist de la sección "Flujo de contribución". Si el build pasa y el flujo del bono sigue funcionando, está en buen camino.

**¿Dónde reporto bugs?**
Abrí un issue en GitHub con el label `bug`. Incluí pasos para reproducir, comportamiento esperado y comportamiento actual.

**¿Cómo contacto al mantenedor?**
A través de los issues o discusiones de GitHub. No hay canal de chat por ahora.

**¿VCRC es dinero real?**
No. Es un activo simbólico en Stellar que registra el precio de cada transacción on-chain. No tiene valor monetario ni es convertible.
