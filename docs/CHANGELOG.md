# VELAR — Changelog de implementaciones

## 2026-06-05 — Web3 expansion + landing redesign

### 🆕 Funcionalidades nuevas

#### Web3 / Stellar
- **Contrato Soroban `VelarBond`**: cada bono nuevo se despliega como contrato
  individual con toda la metadata on-chain. Funciones: `initialize`, `transfer`,
  `freeze`/`unfreeze`, `set_in_escrow`/`set_active`, `details`, `current_owner`,
  `status`, `tse`. 7 errores tipados, eventos por cada acción.
- **Trustless Work como canasta de coordinación**: cada venta crea un contrato
  Single-Release que registra deploy → milestone completed → milestone approved.
  No maneja dinero (sigue siendo custodia simple), solo coordinación on-chain.
- **Asset VCRC** registra el precio de cada venta en una transacción atómica
  junto con la liberación del token del bono.
- **Memos en todas las txs**: `VELAR:issue:`, `escrow:`, `sold:`, `return:`, `bond:`
- **Retorno on-chain del escrow**: dueño solicita al TSE, TSE aprueba y el token
  vuelve al dueño firmado por la wallet escrow.

#### Backend
- Endpoint público `GET /api/explorer/snapshot` (sin auth) con estado on-chain
- Endpoints de analytics para el TSE (overview, by-party, price-history, owners,
  top-bonds, volume-over-time)
- Sistema de reportes del partido al TSE (CRUD + revisión)
- Tests de integración del flujo de bonos (9 tests pasando)

#### Frontend
- Landing rediseñada con hero asimétrico + card glass con stepper vivo
- Página `/explorer` pública sin login con todos los enlaces a stellar.expert
- Sección "¿Para quién es VELAR?" con 3 cards (Partido / TSE / Ciudadanía)
- FAQ con 6 preguntas honestas y disclosure animado
- Animaciones de scroll con Motion v12 (`Reveal`, `Stagger`)
- Sistema de botones unificado con altura, gradientes y pulse rings por color
- Páginas TSE nuevas: `/tse/analytics`, `/tse/reportes`, `/tse/escrows`,
  `/tse/retiros`
- Modal de reporte muestra valor facial + reventas + diferencia con %
- Chips on-chain: 🪙 NFT (morado) para bonos con Soroban, 🛡 Canasta
  Trustless Work (verde) para transferencias con contrato de coordinación

### 🐛 Fixes importantes

- **Trustless Work API**: header correcto es `x-api-key`, no `Authorization:
  Bearer`. `amount`/`platformFee` como `number`. `trustline.symbol`, no
  `assetCode`. Sin esas correcciones devolvía 401 / 400 silenciosamente.
- **Trustline VCRC del receiver** antes de crear el escrow Trustless Work
  (la API valida que la wallet tenga trustline al asset).
- **`releaseFromEscrow` + `settlePrice` en una sola transacción atómica**
  para evitar race conditions de sequence numbers.
- **Trazabilidad del dueño actual** ahora se calcula desde `bond.profiles`
  (current_owner en BD) y no del `from` del último mov.
- **Protección de rutas por rol** en los tres shells.
- **Tab "En canasta" en `/tse/escrows`** filtra por status (en_escrow,
  pago_registrado, pago_validado), no por presencia de contractId.
- **Ruta `/entrar` como alias de `/login`** para evitar service workers
  zombies que cacheaban /login.

### 🛠️ Cambios técnicos del contrato Soroban

- `#[contracttype]` no soporta discriminants explícitos en enums → eliminados
  los `= N` en `Status`.
- `Error` debe usar `#[contracterror] + #[repr(u32)]` para que el contrato
  compile.
- Soroban limita funciones a 10 parámetros → `initialize` recibe ahora
  `(tse, args: InitArgs)` donde `InitArgs` es un struct con `#[contracttype]`.

### 📊 Composición actual del sistema

```
Frontend Next.js (UI / shells / formularios)   ~63%
Backend NestJS web2 (auth, queries, analytics) ~10%
Backend mixto (bonds + transfers + Stellar)    ~12%
Stellar SDK + Soroban + Trustless Work          ~6%
Schema SQL + tipos compartidos                  ~9%
```

De 52 endpoints HTTP, **14 tocan blockchain (~27%)**.

---

## Cómo activar el Nivel 1 Web3 (Soroban NFT)

```bash
# 1. Compilar y subir el WASM (requiere rustup + stellar-cli)
rustup target add wasm32-unknown-unknown
./scripts/soroban-deploy-wasm.sh platform

# 2. Pegar las 2 env vars que imprime en apps/api/.env:
#    SOROBAN_VELAR_BOND_WASM_HASH=<hash>
#    SOROBAN_TSE_ADDRESS=<public key>

# 3. Aplicar migración SQL en Supabase
# (ver supabase/migrations/20260605120000_soroban_contract.sql)

# 4. Reiniciar API
cd apps/api && npm run start
```

A partir de ahí, cada bono nuevo que apruebe el TSE genera su contrato
Soroban en paralelo al Classic Asset. Sin esas env vars el sistema sigue
funcionando con solo Classic Asset (compatibilidad).
