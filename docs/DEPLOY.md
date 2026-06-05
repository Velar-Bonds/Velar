# Deploy en Railway

VELAR se despliega como **dos servicios separados** en Railway dentro del mismo proyecto:

| Servicio | Root directory | Variables de entorno |
|---|---|---|
| `velar-api` | `apps/api` | Ver tabla abajo |
| `velar-web` | `apps/web` | Ver tabla abajo |

---

## Pasos

### 1. Crear proyecto en Railway

1. Ir a [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
2. Seleccionar el repo `Velar-Bonds/Velar`

### 2. Crear el servicio de la API

1. En el proyecto → **Add Service** → **GitHub Repo** → misma repo
2. En Settings del servicio → **Root Directory**: `apps/api`
3. Railway detectará el `nixpacks.toml` automáticamente

**Variables de entorno del servicio `velar-api`:**

```
SUPABASE_URL=https://nqdwmubpnaeukkocrnrs.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service_role key de Supabase>
TRUSTLESS_WORK_API_KEY=<api key de Trustless Work>
TRUSTLESS_WORK_API_URL=https://dev.api.trustlesswork.com
TRUSTLESS_WORK_PLATFORM_ADDRESS=<dirección Stellar de la plataforma>
STELLAR_NETWORK=testnet
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
STELLAR_RPC_URL=https://soroban-testnet.stellar.org
STELLAR_ENABLE_FRIENDBOT=true
WEB_URL=https://<dominio-del-servicio-web>.up.railway.app
PORT=3001

# Wallets de custodia (generadas con npm run provision:wallets)
# Pegar el contenido de .stellar-wallets.json como variables individuales:
PLATFORM_SECRET=S...
TSE_SECRET=S...
ESCROW_SECRET=S...
```

> **Nota sobre wallets:** Antes de hacer deploy, corre `npm run provision:wallets` localmente,
> toma las claves secretas del archivo `.stellar-wallets.json` generado y agrégalas como
> variables de entorno en Railway. **Nunca subas ese archivo al repo.**

### 3. Crear el servicio del frontend

1. **Add Service** → **GitHub Repo** → misma repo
2. Root Directory: `apps/web`
3. El `nixpacks.toml` construye el frontend con `output: standalone`

**Variables de entorno del servicio `velar-web`:**

```
NEXT_PUBLIC_SUPABASE_URL=https://nqdwmubpnaeukkocrnrs.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<anon key de Supabase>
NEXT_PUBLIC_API_URL=https://<dominio-api>.up.railway.app/api
PORT=3000
```

### 4. Configurar dominios

1. En el servicio `velar-api` → **Settings** → **Networking** → **Generate Domain**
2. Copiar esa URL y pegarla en `NEXT_PUBLIC_API_URL` del servicio web y en `WEB_URL` del API
3. Hacer lo mismo para `velar-web`

### 5. Actualizar CORS

Una vez que tengas el dominio del frontend, actualiza `WEB_URL` en el servicio API para que CORS funcione:

```
WEB_URL=https://velar-web.up.railway.app
```

---

## Health checks

Railway verifica automáticamente:
- API: `GET /api` → debe retornar `200`
- Web: `GET /` → debe retornar `200`

---

## Troubleshooting

| Problema | Causa probable | Solución |
|---|---|---|
| Build falla en `@velar/types` | Workspace no resuelto | El `nixpacks.toml` buildea `packages/types` primero |
| API retorna `401` | Variables de Supabase faltantes | Verificar `SUPABASE_SERVICE_ROLE_KEY` en Railway |
| CORS blocked | `WEB_URL` incorrecto en API | Actualizar con el dominio real del frontend |
| Wallets no encontradas | `.stellar-wallets.json` no existe en prod | Agregar variables `PLATFORM_SECRET`, `TSE_SECRET`, etc. |
| Token move falla | Friendbot no disponible en mainnet | Cambiar `STELLAR_NETWORK=mainnet` y fondear wallets manualmente |
