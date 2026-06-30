# Dev API guardrails

Este documento existe para que el error de conexion con la API no vuelva a aparecer por un arranque incompleto del entorno local.

## Error que protege

Mensaje:

```txt
No se pudo conectar con la API en http://localhost:3001/api/users/me.
Verifica que el backend este corriendo y que NEXT_PUBLIC_API_URL apunte a la URL correcta.
```

Causa real cuando se vio en esta rama:

- El frontend estaba sirviendo en `http://localhost:3000`.
- El backend no estaba escuchando en `http://localhost:3001`.
- El proceso activo venia de `apps/web` y ejecutaba `next dev` directo, sin levantar la API.

## Regla permanente

No cambiar el flujo de desarrollo para que el frontend pueda correr solo con `next dev` como comando principal.

El contrato correcto es:

1. `npm run dev` en la raiz ejecuta `scripts/dev.mjs`.
2. `npm run dev` dentro de `apps/web` tambien ejecuta `../../scripts/dev.mjs`.
3. `scripts/dev.mjs` levanta primero `apps/api`.
4. El frontend solo arranca despues de que `http://localhost:3001/api` responde.
5. Si la API se cae durante desarrollo, el runner apaga los procesos controlados y limpia los puertos `3000` y `3001`.

El comando `next dev` queda reservado como `npm run dev:next --workspace apps/web` para uso interno del runner.

## No revertir

No volver a usar estos comandos como flujo principal:

```json
"dev": "npm run dev --workspaces --if-present"
```

```json
"dev": "next dev"
```

Esos comandos permiten que `localhost:3000` quede vivo aunque `localhost:3001` este apagado.

## Verificacion local

Despues de ejecutar `npm run dev`, estas verificaciones deben pasar:

```powershell
Invoke-WebRequest http://localhost:3001/api
```

Debe responder correctamente.

```powershell
try { Invoke-WebRequest http://localhost:3001/api/users/me } catch { $_.Exception.Response.StatusCode.value__ }
```

Debe devolver `401` sin token. Eso confirma que la API esta viva y que la ruta existe.

```powershell
Invoke-WebRequest http://localhost:3000/marketplace
```

Debe responder desde el frontend.

## Si vuelve a fallar

Primero revisar si hay un frontend huerfano escuchando en `3000` sin API en `3001`:

```powershell
Get-NetTCPConnection -LocalPort 3000,3001 -State Listen -ErrorAction SilentlyContinue
```

Si solo aparece `3000`, el problema es un arranque incorrecto. Cerrar ese proceso y volver a levantar con:

```powershell
npm run dev
```

desde la raiz del repo o desde `apps/web`.
