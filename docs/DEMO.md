# DEMO.md : Cómo ver y probar VELAR funcionando

> Guía para levantar el proyecto y **ver con tus propios ojos** que el bono es un
> token real en Stellar y que el flujo completo funciona.

---

## 1. Preparar (una sola vez)

```bash
cd /Users/josue/VELAR
npm install
```

Crear `apps/api/.env` (copiá de `.env.example`) con las claves reales:
```
SUPABASE_URL=https://nqdwmubpnaeukkocrnrs.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<la service_role key de Supabase>
TRUSTLESS_WORK_API_KEY=<no se usa para el token, opcional>
PORT=3001
WEB_URL=http://localhost:3000
```

Provisionar las wallets de Stellar testnet (custodia) y cargar datos demo:
```bash
cd apps/api
npm run provision:wallets   # crea/fondea wallets + cuenta de canasta (escrow)
npm run seed                # 6 usuarios por rol + bonos + transferencias demo
```

> `provision:wallets` genera `apps/api/.stellar-wallets.json` (las llaves de
> custodia; está en `.gitignore`, nunca se sube).

---

## 1.b Consola web sin login manual (recomendado)

Con la API corriendo (`npm run start`), abrí:
```
http://localhost:3001/api/console
```
Botones de un clic para entrar como **🏛️ TSE**, **🎗️ Partido (PLN)**, **👤 Usuario A** o **👤 Usuario B**.
Flujo: TSE emite a un partido  a  Usuario solicita comprar  a  el dueño Acepta (token a la canasta)  a 
Usuario "Registré el pago"  a  el vendedor "Confirmar pago y liberar"  a  el bono cambia de dueño on-chain.
El botón "ver en Stellar" abre la transacción real en stellar.expert.

## 2. La forma más rápida de ver que TODO funciona (CLI)

Con la API corriendo, un solo comando ejecuta el ciclo completo y te da el link a la blockchain:

```bash
cd apps/api
npm run start            # en una terminal (deja corriendo)
npm run demo:flow        # en otra terminal : flujo con cuentas sembradas
npm run demo:register    # registra un partido y un usuario NUEVOS y corre el flujo
```

Vas a ver paso a paso cómo el **token del bono** se mueve:
```
① EMISOR emite el bono como TOKEN en Stellar  a  COMPRADOR
   dueño on-chain: COMPRADOR
② COMPRADOR solicita transferir  a  RECOMPRADOR
③ RECOMPRADOR acepta  a  el TOKEN entra a la CANASTA (escrow) 🔒
   dueño on-chain: ESCROW
④ RECOMPRADOR registra el pago físico (hash de evidencia)
⑤ VALIDADOR confirma el pago
⑥ VALIDADOR libera  a  el TOKEN sale de la canasta  a  RECOMPRADOR
   dueño on-chain: RECOMPRADOR
🔗 https://stellar.expert/explorer/testnet/asset/DEMO...-G...
```

**Abrí ese link.** Vas a ver, en el explorador PÚBLICO de Stellar, el activo del
bono y **todas sus transacciones reales** (emisión, paso a la canasta, liberación).
Eso es la prueba de que el bono vive en la blockchain.

---

## 3. Usuarios de prueba (password para todos: `Velar12345!`)

| Rol | Email | Qué puede hacer |
|---|---|---|
| TSE | tse@velar.cr | Ver todos los bonos, historial, congelar |
| Emisor | emisor@velar.cr | Registrar/emitir bonos (PLN) |
| Comprador | comprador@velar.cr | Ver sus bonos, iniciar transferencia |
| Recomprador | recomprador@velar.cr | Recibir, aceptar, registrar pago |
| Validador | validador@velar.cr | Validar pago y liberar |
| Admin | admin@velar.cr | Gestionar usuarios/roles |

---

## 4. Probar manualmente con la API (curl)

**a) Obtener un token de sesión** (ejemplo TSE):
```bash
curl -s "https://nqdwmubpnaeukkocrnrs.supabase.co/auth/v1/token?grant_type=password" \
  -H "apikey: sb_publishable_JknXcCiIpETjRHEEhHUbBg_r0cCNo9y" \
  -H "Content-Type: application/json" \
  -d '{"email":"tse@velar.cr","password":"Velar12345!"}'
# copiá el "access_token"
```

**b) Listar bonos** (lo que vería el TSE):
```bash
curl -s http://localhost:3001/api/bonds -H "Authorization: Bearer <TOKEN>"
```

**c) Ver el dueño on-chain de un bono + link a la blockchain:**
```bash
curl -s http://localhost:3001/api/bonds/<tokenId>/onchain -H "Authorization: Bearer <TOKEN>"
```

Endpoints completos del flujo en `docs/FRONTEND_GUIDE.md`.

---

## 5. Qué mirar para confirmar que es real

- En `demo:flow`, el **dueño on-chain** cambia solo cuando el token se mueve de verdad.
- En **stellar.expert** (link que imprime el demo) ves las transacciones reales con sus hashes.
- Si paras la API y la volvés a levantar, el dueño on-chain **sigue siendo el mismo**:
  porque la verdad está en la blockchain, no en memoria.
- Supabase solo guarda usuarios/roles (auth). La propiedad del bono vive en Stellar.
