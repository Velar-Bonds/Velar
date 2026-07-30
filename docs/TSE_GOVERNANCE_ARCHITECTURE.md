# TSE Governance Architecture — Command center de cumplimiento, auditoría y gobernanza (issue #41)

> Documento de arquitectura del backend. Refleja el código real en `apps/api/` al momento de este PR.
> Complementa la sección 8 de `docs/BACKEND.md` (ciclo de vida del reporte, issue #40).

---

## 1. Resumen

Este PR extiende el epic existente del lado del partido — ciclo de vida del reporte mensual (`apps/api/src/reports/domain/{workflow,reconciliation,deadlines}.ts`, `ReportLifecycleService`) — con la **capa de gobernanza del TSE**: workflow formal de decisiones con doble control y concurrencia optimista, motor de reglas explicable/versionado/backtestable, autorización ABAC, audit log encadenado por hash, motor de SLA/escalamiento, analytics de cumplimiento con forecast determinístico, y exports streaming con evidencia de integridad.

**Alcance deliberado: solo backend.** No hay frontend de command center en este PR (cola de revisión, workspace de conciliación, visor de audit trail, gráficos KPI/forecast, UI de export). La superficie HTTP y los tipos en `@velar/types` están listos para un PR de frontend posterior.

**Sin infraestructura viva.** Ningún componente de este PR usa credenciales VELAR ni toca Supabase/Stellar en runtime de producción. Toda pieza que accede a DB se ejercita en tests con implementaciones fake de `SupabaseService` en memoria; las funciones de dominio son puras y se prueban con fixtures.

---

## 2. Workflow formal (dual control + concurrencia optimista)

La máquina de estados vive en `apps/api/src/reports/domain/workflow.ts` (funciones puras, sin DB). Extiende el ciclo del issue #40 con dos estados nuevos terminales/intermedios y la guarda `resolveDecision()`.

### Tabla de transiciones

| Estado origen | Transiciones permitidas |
|---|---|
| `borrador` | `enviado` |
| `enviado` | `en_revision` |
| `en_revision` | `observado`, `aprobado`, `rechazado`, `pendiente_segunda_aprobacion` |
| `observado` | `reenviado` |
| `reenviado` | `en_revision` |
| `pendiente_segunda_aprobacion` | `aprobado`, `observado`, `rechazado` |
| `aprobado` | *(terminal)* |
| `rechazado` | *(terminal)* |
| `revisado` *(legacy)* | `observado`, `aprobado` |

Estados terminales: `aprobado`, `rechazado`.

### Dual control (`resolveDecision`)

Cuando el TSE solicita `aprobado`, `resolveDecision()` aplica una guarda de monto antes de seguir la tabla:

| Contexto | Condición | Estado resultante |
|---|---|---|
| `en_revision` + aprobar | `declaredTotal >= dualControlThreshold` | `pendiente_segunda_aprobacion` (`requiresSecondApproval: true`) |
| `en_revision` + aprobar | `declaredTotal < dualControlThreshold` | `aprobado` (directo) |
| `pendiente_segunda_aprobacion` + aprobar | — | `aprobado` (`isSecondApproval: true`) |
| Cualquier otro par legal | — | el estado solicitado tal cual |

**Umbral arquitectónico:** `dualControlThreshold` se lee del rule-set `v1` (`thresholdBreachAmount = 5_000_000`) vía `getRuleSet(DEFAULT_RULE_SET_VERSION)` en `ReportsService.review()`. Un reporte lo bastante grande como para disparar un finding `threshold_breach` en el motor de reglas también requiere segundo aprobador — misma constante, dos usos distintos (decisión vs. evaluación).

**Segregación de funciones (SoD):** al completar la segunda aprobación, `ReportsService` consulta `report_decision_approvals` (fila con `status = 'pending_second'`) y rechaza con `403` si `first_approver_id === actorId`. La primera aprobación inserta la fila pendiente; la segunda la cierra con `second_approver_id` y `status = 'completed'`.

### Concurrencia optimista

`reports.current_version` (ya existente desde #40) se reutiliza como etag de versión. En `PATCH /reports/:id/review`:

- `expectedVersion` es **opcional** en el body.
- **Omitido:** update incondicional — el frontend actual sigue funcionando igual que antes.
- **Presente:** el update incluye `.eq('current_version', expectedVersion)`; si no coincide → `409 Conflict` con mensaje de recarga.

Cada decisión exitosa incrementa `current_version`.

### Endpoint (extensión, no paralelo)

Per instrucción explícita del issue, esto **extiende** el endpoint existente en `ReportsController` / `ReportsService`, no introduce uno nuevo:

```
PATCH /api/reports/:id/review
Body: { status: 'observado' | 'aprobado' | 'rechazado' | 'revisado', notes?, expectedVersion? }
Auth: TSE/admin (revisado es marcador legacy sin dual control)
```

También se agrega:

```
PATCH /api/reports/:id/assign
Body: { reviewerId }
Auth: admin
```

---

## 3. Motor de reglas (explicable, versionado, backtestable)

Ubicación: `apps/api/src/reports/rules/`.

### `evaluate()` (`engine.ts`)

Función pura y determinística. Toma conciliación + cumplimiento de período ya computados y produce `RuleEvalResult` con `Finding[]` tipados:

| Tipo | Origen |
|---|---|
| `amount_mismatch` | Discrepancia de conciliación |
| `missing_bond` | Discrepancia de conciliación |
| `unknown_reference` | Discrepancia de conciliación |
| `overdue` | `PeriodCompliance` en `overdue` o `missing` |
| `threshold_breach` | `declaredTotal >= thresholdBreachAmount` del rule-set |

Cada finding incluye `severity`, `score`, `message` y un array `explanation` con traza paso a paso del razonamiento (legible para un revisor humano).

### Versiones (`rule-sets.ts`)

| Versión | Bandas `amount_mismatch` (low/medium/high) | `thresholdBreachAmount` |
|---|---|---|
| `v1` (default) | 0.10 / 0.30 / 0.60 | 5_000_000 |
| `v2` (más estricto) | 0.05 / 0.15 / 0.40 | 3_000_000 |

`v2` existe para que el backtesting produzca diffs visibles frente a `v1`.

### Backtesting (`backtest.ts`)

`backtest(baselineVersion, candidateVersion, fixtures)` reutiliza `reconcile()` y `computeCompliance()` del dominio #40, evalúa cada fixture histórico bajo ambas versiones y devuelve diffs (`added`, `removed`, `severityChanged`) por reporte.

```
POST /api/reports/lifecycle/rules/backtest
Auth: admin (@Roles('admin'))
Body: { baselineVersion, candidateVersion, fixtures: HistoricalReportFixture[] }
```

### Evaluación en vivo + audit trail

```
GET /api/reports/lifecycle/:id/findings
```

`ReportLifecycleService.getFindings()` corre `evaluate()` con `DEFAULT_RULE_SET_VERSION` (`v1`) e inserta append-only en `rule_evaluations` (best-effort: un fallo de insert no bloquea la respuesta). Accesible al partido dueño y a TSE/admin.

---

## 4. Conciliación on-chain con consistencia eventual

`apps/api/src/reports/domain/reconciliation-window.ts` envuelve la `reconcile()` pura existente (#40) con `reconcileWithTolerance()`:

**Entradas adicionales:**
- `ChainObservation`: `observedAt` (ISO) + `confirmations` (bloques/confirmaciones de la lectura).
- `ToleranceWindowConfig`: `requiredConfirmations` + `toleranceWindowMs`.

**Lógica:**
1. Si `reconcile()` devuelve `clean` → `windowStatus: 'clean'`, `shouldRecheck: false`.
2. Si hay discrepancias **y** confirmaciones suficientes **y** la ventana de gracia expiró → `windowStatus: 'discrepancies'` (definitivo).
3. En cualquier otro caso con discrepancias → `windowStatus: 'pending_confirmation'`, `shouldRecheck: true`.

Diseñado para el caso en que una lectura on-chain está desactualizada por una transferencia muy reciente aún sin confirmar. **No hay lectura de cadena viva:** se alimenta con fixtures en tests; no está cableado a un endpoint HTTP en este PR.

---

## 5. ABAC + segregación de funciones

Ubicación: `apps/api/src/auth/abac/`.

### `evaluateAbac()` (`abac.ts`)

Función pura, sin dependencias de Nest. Orden de evaluación:

1. `admin` → siempre permitido (`admin_bypass`).
2. Rol distinto de `tse` → denegado (`role_not_authorized`).
3. `BACKTEST_RULES` → solo admin (`backtest_requires_admin`).
4. `SECOND_APPROVE_REPORT` con `priorApproverId === userId` → denegado (`segregation_of_duties_same_approver`).
5. Acciones de decisión sobre reporte (`REVIEW_REPORT`, `APPROVE_REPORT`, `SECOND_APPROVE_REPORT`) con `assignedReviewerId` definido y distinto de `userId` → denegado (`assigned_to_other_reviewer`).
6. Resto → permitido (`authorized`).

`AbacService.assertAllowed()` envuelve la función y lanza `ForbiddenException` con el `reason`.

### Cableado actual

`ReportsService.review()` llama `assertAllowed()` con `assignedReviewerId` de la fila del reporte. La SoD del segundo aprobador se refuerza además en el service contra `report_decision_approvals.first_approver_id` (la regla ABAC #4 aplica cuando el caller pasa `priorApproverId`).

Analytics (`ComplianceAnalyticsService`) y exports (`ExportsService`) usan gates de rol directos (`tse`/`admin`), no pasan por ABAC — las acciones `VIEW_ANALYTICS` y `EXPORT_REPORT` existen en `@velar/types` para contratos futuros.

### Tabla de políticas (acciones cableadas en revisión)

| Acción | Rol | Asignación (`assigned_reviewer_id`) | Resultado |
|---|---|---|---|
| `REVIEW_REPORT` / `APPROVE_REPORT` | `admin` | cualquiera | ✅ permitido |
| `REVIEW_REPORT` / `APPROVE_REPORT` | `tse` | sin asignar (`null`) | ✅ permitido |
| `REVIEW_REPORT` / `APPROVE_REPORT` | `tse` | = actor | ✅ permitido |
| `REVIEW_REPORT` / `APPROVE_REPORT` | `tse` | ≠ actor | ❌ `assigned_to_other_reviewer` |
| `SECOND_APPROVE_REPORT` | `admin` | cualquiera | ✅ permitido |
| `SECOND_APPROVE_REPORT` | `tse` | (vía DB) `first_approver_id = actor` | ❌ `403` segregación de funciones |
| `BACKTEST_RULES` | `admin` | — | ✅ (vía `@Roles('admin')` en controller) |
| `BACKTEST_RULES` | `tse` | — | ❌ `backtest_requires_admin` |
| Cualquiera | ≠ `tse`/`admin` | — | ❌ `role_not_authorized` |

---

## 6. Audit log encadenado (hash chain)

### Primitivas puras (`audit-chain.ts`)

- `canonicalize()`: serialización determinística (claves JSON ordenadas recursivamente).
- `computeEventHash(prevHash, canonical)`: `sha256(prevHash + canonical)` en hex; `prevHash` null → cadena vacía.
- `verifyChain(events)`: detecta `hash_mismatch`, `broken_link`, `gap`. Ignora filas con `chainSeq == null`.

### Integración transparente (`AuditService.emit()`)

Cada `emit()` existente ahora, sin cambios en los call sites:

1. Lee el tip de la cadena (`chain_seq`/`hash` máximo).
2. Calcula `nextSeq`, `prevHash`, `hash`.
3. Inserta con columnas `chain_seq`, `prev_hash`, `hash`.

Eventos históricos anteriores a la migración conservan esas columnas en `NULL`; `verifyChain()` los salta.

### Endpoint de audit trail por reporte

```
GET /api/reports/lifecycle/:id/audit-chain
```

`AuditService.getReportAuditTrail()`:

1. Carga y verifica la **cadena global completa**.
2. Filtra en JS los eventos cuyo `payload.reportId` coincide ( `audit_events` no tiene columna `report_id`).

**Por qué la verificación es global:** la integridad de la cadena es propiedad de la secuencia entera en `chain_seq`. Los eventos de un reporte no son contiguos — se intercalan eventos de bonos, transferencias, otros reportes, etc. Verificar solo el subconjunto filtrado rompería los enlaces `prev_hash` ↔ `hash` entre eventos omitidos.

Respuesta: `{ events: ChainedAuditEvent[], verification: ChainVerificationResult }`.

---

## 7. Motor de SLA y escalamiento

Ubicación: `apps/api/src/sla/`.

### `checkEscalation()` (`sla-engine.ts`)

Función pura, idempotente, **nunca de-escala**: solo sube de nivel si `levelRank(target) > levelRank(current)`.

`computeTargetLevel()` recorre la escalera (`EscalationLadderStep[]`) y elige el nivel más alto cuyo `afterDays <= daysOverdue`, solo si el cumplimiento está en `overdue` o `missing`.

### Configuración y persistencia

- `sla_escalation_config` (seed `GLOBAL`): escalera por defecto de 3 pasos:
  - día 3 → `level_1`, notificar `tse`
  - día 7 → `level_2`, notificar `tse` + `admin`
  - día 14 → `level_3`, notificar `admin`
- `report_sla_state`: nivel actual por reporte (`current_level`, `last_escalated_at`, `breached`).

`SlaService.checkAndEscalate(now)` itera reportes no cerrados (`borrador`, `aprobado`, `rechazado` excluidos), calcula cumplimiento vía `computeCompliance()`, escala si corresponde, persiste estado y emite `report_sla_escalated` al audit log.

**Sin scheduler real en este PR.** Simulación manual:

```
POST /api/sla/check
Auth: admin
```

**Sin notificaciones reales:** el array `notified` del resultado refleja la escalera, pero no se llama a `NotificationsService` (no hay `NotificationType` adecuado — follow-up).

---

## 8. Analytics de cumplimiento + forecast

Módulo **deliberadamente separado** de `apps/api/src/analytics/` (bonos/marketplace — dominio distinto): `apps/api/src/compliance-analytics/`.

Todos los endpoints requieren TSE/admin:

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/compliance-analytics/overview` | Resumen agregado de cumplimiento |
| GET | `/compliance-analytics/by-party` | Tasa de cumplimiento por partido |
| GET | `/compliance-analytics/reviewer-workload` | Carga de revisores + SLA attainment |
| GET | `/compliance-analytics/forecast?horizonMonths=3` | Proyección de vencidos |

### Forecast (`forecast.ts`)

Determinístico, sin dependencia de ML:

- **≥ 3 puntos históricos** de vencidos por período → `linear_trend` (regresión lineal simple).
- **< 3 puntos** → `moving_average` (ventana de hasta 3 períodos).

---

## 9. Exports streaming con evidencia de integridad

Ubicación: `apps/api/src/reports/exports/`.

Auth: TSE/admin (`ExportsService.assertAuth()`).

| Método | Ruta | Formato |
|---|---|---|
| GET | `/reports/exports/decisions.csv` | CSV streaming |
| GET | `/reports/exports/decisions.pdf` | PDF (`pdfkit`) |

### CSV (`csv-export.ts`)

`streamDecisionsCsv()` es un **async generator** consumido vía `Readable.from()` en el controller — streaming genuino, no buferiza el dataset completo. Cada fila de datos encadena hash con `computeEventHash()` (mismo algoritmo que el audit log). Termina con una fila de manifiesto:

```
# manifest: {"format":"csv","generatedAt":"...","rowCount":N,"finalHash":"...","algorithm":"sha256"}
```

### PDF (`pdf-export.ts`)

`buildDecisionsPdf()` produce un stream legible; el pie incluye el mismo `ExportManifest` con `finalHash` recalculado vía `recomputeFinalHash()`.

Filas incluyen metadata de decisión + última evaluación de reglas (`rule_evaluations`) si existe.

---

## 10. Migraciones

Seis migraciones aditivas bajo `supabase/migrations/` (20260728000000–20260728000005). Todas habilitan RLS con políticas SELECT solo TSE/admin; **sin políticas INSERT/UPDATE para `authenticated`** — escritura exclusiva vía `service_role` del backend (mismo patrón que `report_versions`).

| Archivo | Qué agrega |
|---|---|
| `20260728000000_tse_governance_reports.sql` | Estados `rechazado`/`pendiente_segunda_aprobacion` en CHECK de `reports.status`; columna `assigned_reviewer_id` |
| `20260728000001_report_decision_approvals.sql` | Tabla `report_decision_approvals` (dual control: primer/segundo aprobador, status `pending_second`/`completed`) |
| `20260728000002_audit_hash_chain.sql` | Columnas nullable `chain_seq`, `prev_hash`, `hash` en `audit_events` + índice único en `chain_seq` |
| `20260728000003_sla_escalation.sql` | Tablas `sla_escalation_config` (seed escalera 3 pasos) y `report_sla_state` |
| `20260728000004_rule_evaluations.sql` | Tabla append-only `rule_evaluations` (trigger `deny_rule_evaluation_mutation`) |
| `20260728000005_report_governance_audit_events.sql` | Valores nuevos en enum `audit_event_type`: `report_rejected`, `report_assigned`, `report_pending_second_approval`, `report_second_approved`, `report_sla_escalated`, `report_exported` |

---

## 11. Qué queda fuera de esta PR (deliberado)

| Item | Estado |
|---|---|
| Frontend command center (cola, conciliación, audit viewer, KPIs, export UI) | Fuera de scope; backend listo para consumo |
| Notificaciones reales de escalamiento SLA | Solo audit-logged; sin llamada a `NotificationsService` |
| Cron/scheduling de SLA | `POST /sla/check` manual (admin) simula un tick |
| Lectura on-chain viva para `reconcileWithTolerance` | Dominio puro + fixtures; sin endpoint |
| Wire completo de ABAC en analytics/exports | Gates de rol directos; tipos ABAC preparados |

---

## 12. Cómo verificar localmente

Sin credenciales ni infra viva:

```bash
npm run build --workspace @velar/types
npm run test --workspace apps/api
# equivalente: cd apps/api && npx jest

npm run build --workspace apps/api
npm run lint --workspace apps/api
```

Al correr la suite completa: **36 test suites, 331 tests** (cifra actual), todos contra fakes en memoria — cero infraestructura live, cero credenciales VELAR.

Suites relevantes incluyen: `workflow.spec.ts`, `reconciliation-window.spec.ts`, `audit-chain.spec.ts`, `reports.service.spec.ts`, `report-lifecycle.service.spec.ts`, specs de rules/sla/compliance-analytics/exports/abac.
