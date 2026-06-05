# VELAR — Roadmap

Estado a 2026-06-04. Lo que sigue está priorizado por impacto en producto.

---

## ✅ Hecho (resumen alto nivel)

- Auth con 3 perspectivas: usuario / partido / TSE
- Registro automático de wallet Stellar al crear partido o usuario (Friendbot testnet)
- Solicitud de bono por partido → estado `pendiente` en BD (no toca Stellar todavía)
- Aprobación por TSE → emisión real on-chain en Stellar Testnet (issueBond)
- Persistencia de `stellar_transaction_hash`, `stellar_ledger`, `stellar_asset_code`,
  `stellar_issuer_public_key`, `stellar_owner_public_key`, `stellar_status`
- Marketplace con publicación (solo dueño actual), ofertas, contraofertas, escrow,
  registro de pago, validación y liberación
- Asset VCRC emitido por la plataforma para registrar precios on-chain (volumen
  acumulado visible en Stellar Expert)
- `releaseFromEscrow` + pago de VCRC en una sola transacción atómica
- Trazabilidad cronológica con dueño actual correcto en TSE y partido
- Protección de rutas por rol en los tres shells (AppShell, PartidoShell, TSEShell)
- Memos con monto en cada tx Stellar (visibles en Stellar Expert)
- Eventos de auditoría reales en backend para flujos críticos de bonos y transfers

---

## 🚧 Pendiente — Backlog del brief técnico

Lo que pide el brief de calidad y aún no está cerrado:

### Datos reales vs mocks
- [ ] `/tse` (dashboard) — quitar SEED_BONDS/SEED_REQUESTS/SEED_TRANSFERS como fuente
- [ ] `/tse/registros` — usar solo `/api/bonds`
- [ ] `/tse/revision` — usar solo `/api/bonds/requests`
- [ ] `/tse/emision` — usar `/api/parties` en vez de SEED_PARTIES
- [ ] `/tse/trazabilidad` — quitar SEED_BONDS y SEED_TRACEABILITY
- [ ] `/tse/auditoria` — consumir eventos reales (requiere endpoint)
- [ ] `/partido` (dashboard) — quitar MOCK_BONDS y MOCK_TRANSFERS
- [ ] `/partido/mis-bonos` — quitar MOCK_BONDS

### Endpoints faltantes
- [ ] `GET /api/audit/events` — listar eventos para `/tse/auditoria`
- [ ] `GET /api/bonds/:tokenId/traceability` — servicio centralizado de trazabilidad
  que combine: audit_events + transfers + estado on-chain + ofertas + dueños

### Visibilidad on-chain
- [ ] Mostrar `stellar_transaction_hash` con link al explorer en:
  - panel TSE (lista de bonos)
  - `/mis-bonos` del partido y del comprador
  - detalle de cada transferencia liberada
  - timeline de trazabilidad

### Eventos de auditoría que faltan
- [ ] `partido_creado` al registrar party
- [ ] `wallet_creada` al provisionar wallet Stellar
- [ ] `bono_solicitado` al enviar solicitud (hoy solo se emite al aprobar)
- [ ] `solicitud_rechazada` (existe el flujo, no emite audit)
- [ ] `bono_publicado` al poner en marketplace

### UX
- [ ] **Loading states honestos** en botones de aceptar oferta, registrar pago,
      confirmar pago, liberar bono. Botón bloqueado + spinner inline mientras
      el backend espera la confirmación de Stellar (3-5 seg). Decisión tomada:
      **opción A — UX honesto sin background jobs**.
- [ ] **Animaciones / hover** en todos los botones de los flujos críticos:
      contraoferta, aceptar oferta, registrar pago, confirmar pago, publicar,
      cancelar. Hoy varios se ven planos.

### Validaciones técnicas
- [ ] `npm run lint`
- [ ] `npm run typecheck` (pasa pero confirmar tras los cambios)
- [ ] `npm run build` en API y web

---

## 🔥 Features prioritarias (después del backlog)

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
El schema ya tiene `document_hash` pero nadie sube nada.

- Bucket Storage en Supabase con políticas RLS por party_id
- Upload del PDF al solicitar el bono
- SHA-256 server-side
- Hash en el memo de la transacción Stellar de emisión
- Verificación pública: descargar PDF → recomputar hash → comparar con on-chain
- Esto convierte la trazabilidad de "anotación" a "evidencia notarial"

### 3. Public ledger (sin login)
La razón de ser de VELAR es transparencia política. Hoy todo está atrás de un login.

- Ruta `/ledger` accesible sin auth
- Listado público de bonos emitidos por partido
- Montos, fechas, dueños actuales (nombres públicos o anónimos según política)
- Link a Stellar Expert por cada bono
- Filtros por partido, periodo, monto
- Página pública por bono `/ledger/[bond_id]` con timeline + hash

---

## 🟢 Features siguientes

### 4. Validación de pago por validador
El flujo actual no valida nada antes del release.

- Rol `validador` existe en schema pero no se usa
- Después de "comprador registró pago", agregar paso de validador que cruza
  contra evidencia (recibo SINPE, screenshot, ref bancaria)
- Solo después de validar se permite al vendedor liberar el bono

### 5. Vencimiento del bono
Hay `maturity_date` pero no pasa nada cuando vence.

- Estados nuevos: `vencido`, `redimido`, `default`
- Job programado que marca bonos vencidos diariamente
- Flujo para que el partido o el TSE registre el pago del capital al vencimiento
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

- Invitaciones a miembros del partido
- Sub-roles: `tesorero` (solicita y publica), `representante_legal` (firma),
  `lector` (solo ve)

### 9. Reportes PDF/CSV
El TSE va a querer exportar para auditoría externa.

- "Bonos emitidos por partido X en periodo Y"
- "Transferencias en periodo Y"
- "Auditoría completa del bono Z"
- Generación server-side, PDF firmado digitalmente

### 10. Backup de wallets
Si se pierde `apps/api/.stellar-wallets.json` se pierden todas las cuentas de
custodia.

- Cifrar y guardar en Supabase Storage con kms-style key
- Opción de bajar a `.json.gpg` para backup local
- Procedimiento documentado de recovery

### 11. Histórico de precios + mini gráfica
Las últimas N ventas de cada bono en una línea temporal de precio.

- Tabla `bond_prices` poblada en cada release
- Gráfica con recharts o tremor en el detalle del bono
- Sensación de "mercado financiero", no solo de "registro"

---

## Notas técnicas vivas

- **Asset classic vs Soroban**: hoy usamos Stellar Classic Asset (`new Asset(code, issuer)`).
  Para el MVP es correcto y se ve bien en Stellar Expert. Migrar a Soroban
  solo si se necesitan reglas de transferencia programables (whitelist on-chain,
  congelamiento por contrato, etc.)
- **Custodia asistida**: secret keys viven en `apps/api/.stellar-wallets.json`,
  nunca al cliente. Para mainnet eventualmente hay que mover a wallet del usuario
  (Albedo, Freighter, xBull) o a un KMS real.
- **VCRC**: representación en Stellar de colones. Issued por la plataforma.
  Solo simbólico (no convertible a CRC reales). Sirve para que el volumen de
  ventas aparezca en stellar.expert.
- **Memos**: Stellar Memo TEXT limita a 28 bytes UTF-8. Por eso truncamos.
  Para metadata más grande conviene off-chain con hash on-chain.

---

## Decisiones de UX ya tomadas

- **Loading honesto, no fire-and-forget**: cuando el backend está esperando
  Stellar, el botón se bloquea con spinner y el usuario espera. No prometemos
  "ya está" antes de tener el hash confirmado. (Opción A discutida.)
- **Mocks como fallback temporal**: solo en desarrollo. Cuando hay datos reales,
  los reales ganan. Cuando no, se muestra estado vacío con CTA (no datos falsos).
- **Trazabilidad como fuente única**: todas las vistas que muestren historial
  de un bono deben consumir el mismo servicio `getBondTraceability`. Pendiente.
