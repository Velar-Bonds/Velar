# VELAR — Infraestructura Blockchain para Bonos Políticos

Plataforma de trazabilidad digital para el traspaso de bonos de partidos políticos, con escrow on-chain via Trustless Work (Stellar) y base de datos Supabase.

## Stack
- **Frontend**: Next.js 16 + TypeScript + Tailwind CSS → `apps/web`
- **Backend**: NestJS 11 + TypeScript → `apps/api`
- **DB + Auth**: Supabase (PostgreSQL + Auth)
- **Escrow**: Trustless Work sobre Stellar
- **Tipos compartidos**: `packages/types` (@velar/types)

## Setup

### 1. Aplicar migración SQL en Supabase
Entrá al [SQL Editor de Supabase](https://supabase.com/dashboard/project/nqdwmubpnaeukkocrnrs/sql/new) y ejecutá el contenido de:
```
supabase/migrations/20260601000000_initial_schema.sql
```

### 2. Variables de entorno

**`apps/api/.env`:**
```
SUPABASE_URL=https://nqdwmubpnaeukkocrnrs.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service_role key de Supabase>
TRUSTLESS_WORK_API_KEY=tFh9vaxyj83LwXN8YEOFKg...
PORT=3001
WEB_URL=http://localhost:3000
```

**`apps/web/.env.local`** (ya configurado con valores de prueba).

### 3. Instalar dependencias
```bash
npm install
```

### 4. Levantar todo
```bash
npm run dev
```
- API: http://localhost:3001/api
- Web: http://localhost:3000

## Flujo escrow end-to-end
1. **EMISOR** registra bono → token `emitido`
2. **EMISOR** asigna al **COMPRADOR** → `activo`
3. **COMPRADOR** solicita transferencia al **RECOMPRADOR**
4. **RECOMPRADOR** acepta → token `en_escrow` (Trustless Work)
5. **RECOMPRADOR** registra evidencia de pago físico
6. **VALIDADOR** confirma el pago
7. **VALIDADOR** libera el token → nuevo dueño, estado `activo`
8. **TSE** consulta timeline en cualquier momento

## Portales por rol
| Rol | URL |
|---|---|
| EMISOR | `/dashboard/emisor` |
| COMPRADOR | `/dashboard/comprador` |
| RECOMPRADOR | `/dashboard/recomprador` |
| VALIDADOR | `/dashboard/validador` |
| TSE | `/dashboard/tse` |
| ADMIN | `/dashboard/admin` |
