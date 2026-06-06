# VELAR : Roadmap

Estado a 2026-06-05. Lo que sigue está priorizado por impacto en producto.

---

## ✅ Completado en esta iteración

### Web3 / Stellar
- Auth con 3 perspectivas: usuario / partido / TSE
- Registro automático de wallet Stellar al crear partido o usuario (Friendbot testnet)
- Solicitud de bono por partido  a  estado `pendiente` en BD (no toca Stellar todavía)
- Aprobación por TSE  a  emisión real on-chain en Stellar Testnet (issueBond)
- Persistencia de `stellar_transaction_hash`, `stellar_ledger`, `stellar_asset_code`,
  `stellar_issuer_public_key`, `stellar_owner_public_key`, `stellar_status`
- Asset VCRC emitido por la plataforma para registrar precios on-chain (volumen
  acumulado visible en Stellar Expert)
- `releaseFromEscrow` + pago de VCRC en una sola transacción atómica firmada por
  escrow + issuer (sin race conditions de sequence numbers)
- Memos con monto en cada tx Stellar (visibles en Stellar Expert):
  `VELAR:issue:`, `escrow:`, `sold:`, `return:`, `bond:`
- **Contrato Soroban `VelarBond` (Nivel 1 Web3)**: cada bono nuevo se despliega como
  contrato propio con TODA la metadata on-chain (monto, fechas, dueño, partido,
  hash del documento, estado). 9 funciones en Rust + 7 errores tipados.
  Postgres pasa de fuente de verdad a cache + índice.
- **Integración Trustless Work** como canasta de coordinación on-chain: deploy de
  contrato Soroban Single-Release en cada venta. Lifecycle deploy  a  milestone
  completed  a  milestone approved registrado en cadena.
- Chip 🪙 NFT (morado) y chip 🛡 Canasta Trustless Work (verde) en las páginas TSE.
- Flujo de retorno: dueño solicita al TSE retirar bono del escrow con motivo,
  TSE aprueba (mueve token on-chain de escrow al dueño) o rechaza con notas.

### Backend
- Marketplace con publicación (solo dueño actual), ofertas, contraofertas, escrow,
  registro de pago, validación y liberación
- Trazabilidad cronológica con dueño actual correcto en TSE y partido
- Protección de rutas por rol en los tres shells (AppShell, PartidoShell, TSEShell)
- Eventos de auditoría reales en backend para flujos críticos de bonos y transfers
- Endpoints de analytics: `/api/analytics/overview`, `/by-party`,
  `/bonds/:id/price-history`, `/bonds/:id/owners`, `/top-bonds`, `/volume-over-time`
- Sistema de reportes del partido al TSE: `POST /api/reports`,
  `PATCH /api/reports/:id/review` con estados `enviado / revisado / observado / aprobado`
- **Endpoint público sin auth**: `GET /api/explorer/snapshot` devuelve estado
  completo on-chain (assets, contratos, cuentas, glosario de memos)
- Tests de integración: `apps/api/test/bonds-flow.e2e-spec.ts` con 9 tests
  pasando que cubren autorización, solicitud, aprobación, publicación
- Migraciones aplicables: `bond_requests`, `reports`, campos `escrow_return_*`,
  `soroban_contract_id` y demás

### Frontend
- **Landing rediseñada** con referencia visual de transparencia pública
  (hero asimétrico, card glass con stepper en vivo, strip de features, 5 cards
  conectadas, sección dark historial auditable, CTA final, footer estructurado)
- Animaciones de scroll con Motion v12 (`Reveal`, `Stagger`) con respeto a
  `prefers-reduced-motion`
- Sección **"¿Para quién es VELAR?"** con 3 cards (Partido / TSE / Ciudadanía)
- **FAQ** con 6 preguntas honestas (¿qué pasa si VELAR desaparece?, ¿el TSE puede
  borrar?, etc.) con disclosure animado
- Sistema de botones unificado (`btn-action`, `btn-ghost`, `btn-success`,
  `btn-danger`, `btn-warn`, `btn-ghost-danger`, `btn-loading`, `btn-spinner`)
  con altura uniforme, hover lift, sheen diagonal, pulse rings por color
- **Página `/explorer` pública sin login** con todos los enlaces a stellar.expert
  (asset VCRC, plataforma issuer, escrow, NFTs Soroban, contratos Trustless Work,
  bonos recientes, glosario de memos)
- **Página `/tse/analytics`** con métricas por partido, top bonos, histórico de
  precios con porcentajes de cambio, lista de dueños históricos por bono
- **Página `/tse/reportes`** y `/partido/reportes` para enviar y revisar reportes
- **Página `/tse/escrows`** con tabs (Todas / En canasta / Cerradas) + filtro por
  estado, chip de contrato Soroban Trustless Work
- **Página `/tse/retiros`** para que el TSE apruebe o rechace solicitudes de
  retiro de bonos del escrow
- Modal de reporte muestra valor facial + reventas + diferencia con %,
  cadena de propietarios inline, chips clickeables a Stellar
- Ruta `/entrar` como alias de `/login` (evita zombies de service workers)

---

## 🚧 Pendiente : Backlog técnico

### Datos reales vs mocks (parcial)
- [ ] `/tse` (dashboard) : todavía cae a SEED_BONDS/SEED_REQUESTS/SEED_TRANSFERS
  si fetch devuelve vacío
- [ ] `/tse/registros` : fallback a SEED_BONDS cuando vacío
- [ ] `/tse/revision` : fallback a SEED_REQUESTS
- [ ] `/tse/emision` : SEED_PARTIES hardcoded (debería usar `/api/parties`)
- [ ] `/tse/trazabilidad` : fallback a SEED_BONDS y SEED_TRACEABILITY
- [ ] `/tse/auditoria` : eventos hardcoded en el componente (debería usar
  endpoint real `/api/audit/events`)
- [ ] `/partido` (dashboard) : usa MOCK_BONDS, MOCK_TRANSFERS
- [ ] `/partido/mis-bonos` : usa MOCK_BONDS

### Endpoints faltantes
- [ ] `GET /api/audit/events` : listar eventos para `/tse/auditoria`
- [ ] `GET /api/bonds/:tokenId/traceability` : servicio centralizado de trazabilidad
  unificada (audit_events + transfers + estado on-chain + ofertas + dueños)

### Eventos de auditoría que faltan emitir
- [ ] `partido_creado` al registrar party
- [ ] `wallet_creada` al provisionar wallet Stellar
- [ ] `bono_solicitado` al enviar solicitud (hoy solo se emite al aprobar)
- [ ] `solicitud_rechazada` (existe el flujo, no emite audit)
- [ ] `bono_publicado` al poner en marketplace

### Validaciones técnicas
- [ ] `npm run lint`
- [ ] `npm run build` en API y web

---

## 🔥 Features prioritarias siguientes

### 1. Notificaciones in-app + email
Lo que más se siente como "MVP a medias". Hoy nadie se entera sin recargar.

- Tabla `notifications` (user_id, type, payload, read_at)
- Campana en navbar con badge de no leídas
- Emisión al partido cuando aprueban/rechazan
- Emisión al comprador cuando aceptan/contraofertan
- Emisión al vendedor cuando registran pago
- Email opcional vía Resend o Supabase Auth emails
- Realtime opcional con Supabase Realtime

### 2. Documento real del bono (PDF + hash on-chain)
El schema y el contrato Soroban ya tienen `document_hash` pero **nadie sube nada todavía**.

- Bucket Storage en Supabase con políticas RLS por party_id
- Upload del PDF al solicitar el bono
- SHA-256 server-side
- Hash en el `InitArgs.document_hash` del contrato Soroban
- Verificación pública: descargar PDF  a  recomputar hash  a  comparar con on-chain

### 3. Notificaciones en vivo / WebSocket
Realtime de Supabase para que los paneles se actualicen sin recargar.

---

## 🟢 Features siguientes

### 4. Validación de pago por validador
El flujo actual no valida nada antes del release.

- Rol `validador` existe en schema pero no se usa
- Después de "comprador registró pago", agregar paso de validador que cruza
  contra evidencia (recibo SINPE, screenshot, ref bancaria)
- Solo después de validar se permite al vendedor liberar el bono

### 5. Vencimiento del bono
Hay `maturity_date` (en BD y on-chain) pero no pasa nada cuando vence.

- Estados nuevos: `vencido`, `redimido`, `default`
- Job programado que marca bonos vencidos diariamente
- Flujo para registrar el pago del capital al vencimiento
- Notificar al dueño actual cuando esté próximo a vencer

### 6. Dashboard del comprador
Hoy `/` para usuario logueado redirige a marketplace. Debería ser un home propio.

- Resumen de cartera: bonos, valor total, ROI estimado
- Próximos vencimientos
- Notificaciones recientes
- Sugerencias del marketplace según historial

### 7. KYC del comprador
Antes de poder ofertar:

- Campos de cédula + foto
- Estado `kyc_pendiente / kyc_verificado / kyc_rechazado` en profiles
- Block en `POST /transfers` si no está verificado
- Panel del TSE para aprobar KYC (puede ser mock contra lista negra)

---

## 🟡 Long-tail

### 8. Roles internos del partido
Hoy 1 emisor = todo. En un partido real hay tesorero, presidente, secretario.
Invitaciones a miembros + sub-roles (`tesorero`, `representante_legal`, `lector`).

### 9. Reportes PDF/CSV
El TSE va a querer exportar para auditoría externa.
- "Bonos emitidos por partido X en periodo Y"
- "Transferencias en periodo Y"
- Generación server-side con PDF firmado digitalmente

### 10. Backup de wallets
Si se pierde `apps/api/.stellar-wallets.json` se pierden todas las cuentas de
custodia. Cifrar y guardar en Supabase Storage con kms-style key.

### 11. Histórico de precios + mini gráfica
Las últimas N ventas de cada bono en una línea temporal de precio.
Ya tenemos `/tse/analytics/bonds/:tokenId/price-history` calculado en el backend,
falta una gráfica con recharts o tremor en el detalle del bono.

### 12. Migración a Stellar mainnet
Todo corre en testnet. Mainnet requiere wallets fondeadas con XLM real,
revisión de regulación, y posiblemente un partner financiero.

---

## 🟣 Próximos niveles Web3

Roadmap para subir el % de web3 (hoy ~27% con Nivel 1 activo, ver `docs/WEB3.md`):

- **Nivel 2 : Documentos en IPFS** (~+5% web3, ~1 día): PDF del bono a IPFS,
  CID al `metadata_uri` del contrato Soroban
- **Nivel 3 : Marketplace contract** (~+15% web3, ~7 días): toda la lógica de
  `transfers.service.ts` (ofertas, contraofertas, escrow, validación) se mueve
  a un Soroban contract `BondMarketplace`
- **Nivel 4 : Trustless Work full mode** (~+5% web3, ~3 días): comprador
  deposita USDC oficial Stellar al contrato escrow, liberación real on-chain
- **Nivel 5 : Wallets propias** (~+10% web3, alto costo UX): Freighter/Albedo
  para usuarios power, custodia asistida sigue como default
- **Nivel 6 : DAO TSE** (~+5% web3, ~3 días): multisig de 3-5 validadores en
  vez de cuenta única

Total proyectado si se hacen los 5 niveles: **~52% web3 / 48% web2**.

---

## Notas técnicas vivas

- **Asset classic vs Soroban**: usamos ambos en paralelo. Classic Asset
  (cantidad 1) por compatibilidad con explorers viejos + contrato Soroban
  con la metadata real. Postgres es cache.
- **Custodia asistida**: secret keys viven en `apps/api/.stellar-wallets.json`,
  nunca al cliente. Para mainnet eventualmente hay que mover a wallet del usuario
  (Albedo, Freighter, xBull) o a un KMS real.
- **VCRC**: representación en Stellar de colones. Issued por la plataforma.
  Solo simbólico (no convertible a CRC reales). Sirve para que el volumen de
  ventas aparezca en stellar.expert.
- **Memos**: Stellar Memo TEXT limita a 28 bytes UTF-8. Por eso truncamos.
  Para metadata más grande conviene off-chain con hash on-chain.
- **Trustless Work API**: `dev.api.trustlesswork.com` con header `x-api-key`
  (NO Bearer). Devuelve XDR sin firmar, el backend firma con custodia y manda
  vía `POST /helper/send-transaction`. `trustline.symbol` (NO `assetCode`),
  `amount`/`platformFee` como `number`.

---

## Decisiones de UX ya tomadas

- **Loading honesto, no fire-and-forget**: cuando el backend está esperando
  Stellar, el botón se bloquea con spinner y el usuario espera. No prometemos
  "ya está" antes de tener el hash confirmado.
- **Mocks como fallback temporal**: solo en desarrollo. Cuando hay datos reales,
  los reales ganan. Cuando no, idealmente se muestra estado vacío con CTA, pero
  varias páginas TSE/partido aún caen a seed cuando vacío (ver backlog).
- **Trazabilidad como fuente única**: pendiente de implementar el servicio
  centralizado `getBondTraceability`. Hoy cada vista arma su propia versión.
- **/entrar como alias de /login**: para evitar service workers zombies que
  cacheen `/login` con respuestas viejas.
