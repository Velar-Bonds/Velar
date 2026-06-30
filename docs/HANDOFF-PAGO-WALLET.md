# Handoff — Pago con wallet (USDC) en negociaciones

> **Para:** compañero que continúa el feature  
> **Estado:** código parcialmente implementado en el repo; **no funciona end-to-end** en producción/demo (Josue no pudo pagar con wallet).  
> **Objetivo:** que el comprador pueda pagar con Freighter **después** de que el vendedor acepte la negociación, con DvP atómico (USDC → wallet del partido, bono → comprador).

---

## 1. Qué se quiere lograr

1. Al **publicar** un bono, el dueño elige métodos: SINPE, transferencia, **wallet**.
2. En el **marketplace**, el comprador **negocia** y elige cómo pagará (`paymentMethod`).
3. El **vendedor acepta** la oferta.
4. Si el método es `wallet`, el comprador va a **Negociaciones** y pulsa **“Pagar con wallet (USDC)”**.
5. Freighter firma una transacción **atómica**: USDC al vendedor/partido + bono al comprador.
6. El **partido** ve los fondos en su wallet (custodial o Freighter vinculada) en **Partido → Configuración** (`WalletBalances`).

**Importante:** el flujo principal es **negociar → aceptar → pagar**. La “compra instantánea” (`instant-buy/*`) existe como atajo API pero ya **no** es el botón principal en marketplace.

---

## 2. Qué ya está en el código (rama `main` / local)

| Área | Qué hay |
|------|---------|
| **Migraciones SQL** | `20260629120000_self_custody_wallet.sql`, `20260629140000_bond_payment_methods.sql`, `20260630120000_transfer_payment_method.sql` |
| **API** | `paymentMethod` en `POST /transfers`; rama wallet en `acceptTransfer` / `acceptCounterOffer`; `POST /transfers/:id/build-wallet-payment-xdr` y `submit-wallet-payment-xdr` |
| **Front marketplace** | `PaymentMethodPicker`, oferta con `paymentMethod` |
| **Front negociaciones** | Botón “Pagar con wallet (USDC)” si `status === aceptada` y `payment_method === wallet` |
| **Wallet Freighter** | `WalletProvider`, `ConnectWalletButton`, `PATCH /users/me/wallet` |
| **Red** | Soporte testnet/mainnet vía env (`STELLAR_NETWORK`, `NEXT_PUBLIC_STELLAR_NETWORK`) |
| **Docs** | `docs/WEB3.md` (sección métodos de pago + wallet negociado) |

### Archivos clave

```
supabase/migrations/
  20260629120000_self_custody_wallet.sql      # profiles.stellar_public_key
  20260629140000_bond_payment_methods.sql      # bonds.payment_methods[]
  20260630120000_transfer_payment_method.sql   # transfers.payment_method

apps/api/src/transfers/transfers.service.ts    # lógica negociación + wallet DvP
apps/api/src/transfers/transfers.controller.ts # endpoints
apps/api/src/escrow/stellar-bond.service.ts    # buildInstantBuyXdr (co-firma vendedor)

apps/web/app/marketplace/MarketplacePageClient.tsx
apps/web/app/negociaciones/page.tsx
apps/web/components/PaymentMethodPicker.tsx
apps/web/lib/wallet.tsx
apps/web/app/configuracion/page.tsx            # vincular Freighter al perfil
```

---

## 3. Flujo técnico esperado

```
Marketplace
  POST /api/transfers
  { bondTokenId, amount, message, paymentMethod: "wallet" }

Vendedor acepta
  PATCH /api/transfers/:id/accept
  → transfer.status = "aceptada"  (NO entra a en_escrow si payment_method = wallet)
  → bond.status = "en_escrow"     (reservado en BD, sin lock TW off-chain)

Comprador paga
  POST /api/transfers/:id/build-wallet-payment-xdr
  → Freighter signTransaction
  POST /api/transfers/:id/submit-wallet-payment-xdr { signedXdr }
  → transfer.status = "liberada", bond.current_owner = comprador
```

### Endpoints

| Método | Ruta | Quién |
|--------|------|-------|
| `POST` | `/transfers` | Comprador (oferta + `paymentMethod`) |
| `PATCH` | `/transfers/:id/accept` | Vendedor |
| `POST` | `/transfers/:id/build-wallet-payment-xdr` | Comprador |
| `POST` | `/transfers/:id/submit-wallet-payment-xdr` | Comprador |
| `PATCH` | `/users/me/wallet` | Comprador (vincular `stellar_public_key`) |

---

## 4. Por qué probablemente “no deja pagar” hoy

Revisar **en este orden**. Son las causas más probables según el código actual.

### 4.1 Migraciones no aplicadas en Supabase (muy probable)

Si faltan columnas, el backend hace **fallback silencioso**:

- Sin `transfers.payment_method` → al crear oferta se guarda sin método → backend asume `sinpe`.
- Al aceptar → entra al flujo **P2P** (`en_escrow`) → el comprador ve **“Registré el pago”**, **no** “Pagar con wallet”.
- Sin `bonds.payment_methods` → el bono no declara que acepta wallet.
- Sin `profiles.stellar_public_key` → `PATCH /users/me/wallet` falla.

**Verificar en Supabase SQL Editor:**

```sql
-- ¿Existen las columnas?
SELECT column_name FROM information_schema.columns
WHERE table_name = 'transfers' AND column_name = 'payment_method';

SELECT column_name FROM information_schema.columns
WHERE table_name = 'bonds' AND column_name = 'payment_methods';

SELECT column_name FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'stellar_public_key';

-- ¿La negociación tiene wallet?
SELECT id, status, payment_method, amount, bond_token_id
FROM transfers
ORDER BY created_at DESC
LIMIT 10;
```

**Acción:** aplicar las 3 migraciones en orden (Dashboard → SQL o `supabase db push`).

---

### 4.2 Comprador no vinculó Freighter al perfil

El backend **exige** `profiles.stellar_public_key` para pagar (no basta con “Conectar wallet” en la UI).

**Pasos del comprador:**

1. Instalar [Freighter](https://www.freighter.app/) en la misma red que VELAR (testnet o mainnet).
2. **Configuración → Tu wallet (Freighter) → Conectar → “Usar esta wallet en mi cuenta”**.
3. Confirmar que `PATCH /api/users/me/wallet` responde `{ ok: true, stellar_public_key: "G..." }`.

Si solo conectó Freighter en el navbar pero **no** vinculó al perfil, `build-wallet-payment-xdr` responde 400 con mensaje tipo *“Conectá y vinculá tu wallet…”*.

---

### 4.3 UI: botón no aparece

El botón **solo** se muestra si **las tres** condiciones se cumplen:

- `transfer.status === 'aceptada'`
- `transfer.payment_method === 'wallet'`
- El usuario logueado es `to_owner` (comprador)

Si la negociación quedó en `en_escrow`, el flujo fue P2P (migración faltante u oferta sin `paymentMethod: wallet`).

**Archivo:** `apps/web/app/negociaciones/page.tsx` → función `actionFor()`.

---

### 4.4 Bug conocido: co-firma del vendedor (bloqueador on-chain)

`buildInstantBuyXdr` (usado también para pago negociado) **co-firma** la operación del bono con la llave **custodial** del vendedor:

```typescript
// apps/api/src/escrow/stellar-bond.service.ts
tx.sign(this.wallets.keypairFor(sellerAddress));
```

Pero `paymentWalletOf()` resuelve el destino del USDC así:

1. `profiles.stellar_public_key` (Freighter del vendedor) ← **prioridad**
2. `profiles.stellar_wallet` (custodial)
3. `parties.stellar_wallet`

**Problema:** si el vendedor/partido tiene Freighter vinculada (`stellar_public_key`), el USDC iría ahí, pero el backend **no tiene la secret key** de esa cuenta → `keypairFor()` lanza:

> `No hay llave en custodia para G...`

**Fix sugerido (elegir uno):**

| Opción | Descripción |
|--------|-------------|
| **A (rápida demo)** | Para DvP, usar **siempre** `stellar_wallet` custodial del vendedor como `sellerAddress` para co-firma; Freighter del partido solo para **ver** saldos. |
| **B (correcta self-custody)** | Si `sellerAddress` es Freighter, **no** co-firmar en backend; devolver XDR sin firmar op del bono y que el **vendedor también firme** (2 firmantes) o usar contrato/escrow Soroban. |
| **C (híbrida)** | `paymentWalletOf` para USDC = Freighter; `bondSourceAddress` = custodial donde está el bono on-chain (pueden ser distintas). |

Hasta resolver esto, el pago wallet **fallará en build-xdr** aunque migraciones y vinculación estén bien.

---

### 4.5 Wallets de custodia no provisionadas en Vercel

En local: `npm run provision:wallets` → `apps/api/.stellar-wallets.json`.

En **velar-api (Vercel)** debe existir `STELLAR_WALLETS_JSON` con el JSON de custodia (platform, escrow, wallets de demo). Sin eso, StellarBondService no puede emitir/mover bonos ni co-firmar.

**Verificar:** logs de Vercel al llamar `build-wallet-payment-xdr`.

---

### 4.6 Red / Freighter desalineados

| Entorno | API | Front | Freighter |
|---------|-----|-------|-----------|
| Testnet (default) | `STELLAR_NETWORK=testnet` | `NEXT_PUBLIC_STELLAR_NETWORK` unset o `testnet` | TESTNET |
| Mainnet | `STELLAR_NETWORK=mainnet` | `NEXT_PUBLIC_STELLAR_NETWORK=mainnet` | PUBLIC |

Si API está en testnet y Freighter en PUBLIC (o al revés), firma o submit fallan.

**Archivos:** `apps/api/src/escrow/stellar.config.ts`, `apps/web/lib/wallet.tsx`.

---

### 4.7 Fondos insuficientes en testnet

El comprador necesita en su Freighter (testnet):

- **XLM** para fees
- **USDC testnet** en la cantidad calculada (`amount CRC / STELLAR_USDC_CRC_RATE`, default 530)

El vendedor custodial necesita el **bono** en su wallet (emitido al aprobar el bono).

Friendbot solo da XLM: `https://friendbot.stellar.org?addr=G...`  
USDC testnet: el backend puede provisionar en otros flujos (`provisionUsdc`); verificar si aplica al DvP directo.

---

## 5. Checklist de implementación (para el compañero)

### Fase 0 — Infra (obligatorio)

- [ ] Aplicar migraciones SQL en Supabase prod (las 3 listadas arriba).
- [ ] Confirmar `STELLAR_WALLETS_JSON` en **velar-api** Vercel.
- [ ] Confirmar `NEXT_PUBLIC_API_URL` en **velar-web** apunta a la API desplegada.
- [ ] Alinear red testnet en API + front + Freighter (o mainnet en los tres).

### Fase 1 — Flujo happy path testnet

- [ ] Partido publica bono con método **wallet** marcado (`PublishBondDialog`).
- [ ] Comprador vincula Freighter en **Configuración** (`PATCH /users/me/wallet`).
- [ ] Comprador oferta en marketplace con **Wallet · USDC**.
- [ ] Verificar en DB: `transfers.payment_method = 'wallet'`.
- [ ] Vendedor acepta → `transfers.status = 'aceptada'` (no `en_escrow`).
- [ ] Comprador ve botón violeta en **Negociaciones**.
- [ ] `build-wallet-payment-xdr` responde 200 con `xdr` (si 500, revisar §4.4 y §4.5).
- [ ] Freighter firma → `submit-wallet-payment-xdr` → tx en Stellar Expert.
- [ ] Partido ve USDC en **Partido → Configuración → WalletBalances**.

### Fase 2 — Fix co-firma (§4.4)

- [ ] Implementar opción A, B o C.
- [ ] Probar con partido que **solo** tiene wallet custodial.
- [ ] Probar con partido que tiene Freighter vinculada (caso que hoy rompe).

### Fase 3 — Mainnet (cuando toque)

- [ ] `STELLAR_NETWORK=mainnet` + `NEXT_PUBLIC_STELLAR_NETWORK=mainnet`
- [ ] USDC issuer mainnet configurado en backend (ver `stellar-bond.service.ts` / env)
- [ ] Sin Friendbot; wallets con XLM + USDC reales
- [ ] Documentar en `.env.example` del front las vars de red

### Fase 4 — UX (nice to have)

- [ ] Mostrar error claro si falta vincular wallet (link a Configuración).
- [ ] Mostrar `payment_method` en lista de negociaciones del partido.
- [ ] Auto-vincular Freighter al conectar si el usuario acaba de ofertar con wallet.
- [ ] Quitar o esconder `instant-buy` si ya no se usa.

---

## 6. Cómo probar manualmente (curl)

Reemplazar `TOKEN`, `TRANSFER_ID`, etc.

```bash
# 1. Vincular wallet comprador
curl -X PATCH "$API/users/me/wallet" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"publicKey":"G..."}'

# 2. Crear oferta wallet
curl -X POST "$API/transfers" \
  -H "Authorization: Bearer $TOKEN_BUYER" \
  -H "Content-Type: application/json" \
  -d '{"bondTokenId":"UUID","amount":950000,"paymentMethod":"wallet"}'

# 3. Aceptar (token vendedor)
curl -X PATCH "$API/transfers/$TRANSFER_ID/accept" \
  -H "Authorization: Bearer $TOKEN_SELLER"

# 4. Build XDR (token comprador)
curl -X POST "$API/transfers/$TRANSFER_ID/build-wallet-payment-xdr" \
  -H "Authorization: Bearer $TOKEN_BUYER"

# 5. Submit (después de firmar en Freighter)
curl -X POST "$API/transfers/$TRANSFER_ID/submit-wallet-payment-xdr" \
  -H "Authorization: Bearer $TOKEN_BUYER" \
  -H "Content-Type: application/json" \
  -d '{"signedXdr":"AAAA..."}'
```

`$API` = ej. `https://velar-api.vercel.app/api`

---

## 7. Variables de entorno

### API (`apps/api/.env` / Vercel velar-api)

```env
STELLAR_NETWORK=testnet          # o mainnet
STELLAR_HORIZON_URL=...
STELLAR_USDC_CRC_RATE=530        # conversión CRC → USDC en DvP
STELLAR_WALLETS_JSON={...}        # obligatorio en prod
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### Web (`apps/web/.env` / Vercel velar-web)

```env
NEXT_PUBLIC_API_URL=https://velar-api.vercel.app/api
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
NEXT_PUBLIC_STELLAR_NETWORK=testnet   # o mainnet
# NEXT_PUBLIC_SELF_CUSTODY=1           # solo para firma vendedor alternativa; NO requerido para pagar como comprador
```

---

## 8. Cuentas demo (referencia)

| Rol | Email | Password |
|-----|-------|----------|
| TSE | `tse@velar.cr` | `Velar12345!` |
| Emisor/partido | `emisor@velar.cr` | `Velar12345!` |
| Recomprador | `recomprador@velar.cr` | `Velar12345!` |

URLs desplegadas (última sesión):  
- Web: `https://velar-web.vercel.app`  
- API: `https://velar-api.vercel.app/api`

---

## 9. Referencias

- `docs/WEB3.md` — arquitectura Stellar, custodia, métodos de pago
- `docs/AGENTS.md` — reglas del repo (no romper flujo P2P existente)
- `docs/DEMO.md` — demo custodial clásica
- Stellar + Freighter: https://www.freighter.app/

---

## 10. Resumen en una frase

**El código del flujo wallet post-negociación está escrito, pero falla en prod porque (1) faltan migraciones Supabase, (2) el comprador debe vincular Freighter al perfil, y (3) hay un bug de co-firma cuando el vendedor usa Freighter en vez de wallet custodial — eso hay que arreglarlo antes de que el pago on-chain funcione de verdad.**

Suerte — cualquier duda, buscar en el repo `build-wallet-payment-xdr` y `paymentWalletOf`.
