/**
 * Reporte mensual del partido al TSE — ciclo de vida completo, versionado y
 * motor de conciliación contra los bonos que el partido realmente posee on-chain.
 *
 * Esta es la FUENTE DE VERDAD del dominio de reportes: la comparten `apps/api`
 * (lógica y persistencia) y `apps/web` (builder multi-paso e historial). El
 * módulo `reports` original solo guardaba metadata de texto libre; esto lo
 * extiende a un reporte estructurado, con archivos, líneas y conciliación.
 */

// ---------------------------------------------------------------------------
// Estados del workflow
// ---------------------------------------------------------------------------

/**
 * Ciclo legal del reporte:
 *   borrador → enviado → en_revision → observado → reenviado → (en_revision) → aprobado
 *
 * `aprobado` es terminal. `observado` es la vía de corrección: el partido
 * reenvía (nueva versión) y vuelve a revisión.
 */
export const ReportStatus = {
  BORRADOR: 'borrador',
  ENVIADO: 'enviado',
  EN_REVISION: 'en_revision',
  OBSERVADO: 'observado',
  REENVIADO: 'reenviado',
  APROBADO: 'aprobado',
} as const;

export type ReportStatus = (typeof ReportStatus)[keyof typeof ReportStatus];

/** Estados en los que el partido todavía puede editar el borrador/corregir. */
export const EDITABLE_REPORT_STATUSES: ReportStatus[] = [
  ReportStatus.BORRADOR,
  ReportStatus.OBSERVADO,
];

// ---------------------------------------------------------------------------
// Líneas del reporte
// ---------------------------------------------------------------------------

/** Categoría contable de una línea del reporte. */
export const ReportLineCategory = {
  INGRESO: 'ingreso',
  EGRESO: 'egreso',
  DONACION: 'donacion',
  BONO: 'bono',
  OTRO: 'otro',
} as const;

export type ReportLineCategory =
  (typeof ReportLineCategory)[keyof typeof ReportLineCategory];

export interface ReportLineItem {
  id: string;
  reportId: string;
  concept: string;
  amount: number;
  category: ReportLineCategory;
  /** Referencia al bono declarado (si la línea corresponde a un bono). */
  bondTokenId: string | null;
  createdAt: string;
}

/** Payload para crear/editar una línea (sin ids ni timestamps). */
export interface ReportLineItemInput {
  concept: string;
  amount: number;
  category: ReportLineCategory;
  bondTokenId?: string | null;
}

// ---------------------------------------------------------------------------
// Archivos adjuntos
// ---------------------------------------------------------------------------

/** Resultado del hook de antivirus (interfaz + stub, sin vendor real). */
export const FileScanStatus = {
  PENDING: 'pending',
  CLEAN: 'clean',
  INFECTED: 'infected',
} as const;

export type FileScanStatus =
  (typeof FileScanStatus)[keyof typeof FileScanStatus];

export interface ReportFile {
  id: string;
  reportId: string;
  /** Ruta dentro del bucket privado de Storage. */
  filePath: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  /** SHA-256 en hex del contenido, para integridad. */
  checksum: string;
  scanStatus: FileScanStatus;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Versionado inmutable
// ---------------------------------------------------------------------------

/** Foto inmutable del reporte al momento de un envío. */
export interface ReportSnapshot {
  status: ReportStatus;
  title: string;
  periodYear: number;
  periodMonth: number;
  lineItems: Omit<ReportLineItem, 'reportId' | 'createdAt'>[];
  files: Omit<ReportFile, 'reportId' | 'createdAt'>[];
  declaredTotal: number;
  reconciliation: ReconciliationResult;
}

export interface ReportVersion {
  id: string;
  reportId: string;
  version: number;
  status: ReportStatus;
  snapshot: ReportSnapshot;
  createdBy: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Reporte mensual
// ---------------------------------------------------------------------------

export interface MonthlyReport {
  id: string;
  partyId: string;
  /** Año del período reportado. */
  periodYear: number;
  /** Mes del período reportado, 1-12. */
  periodMonth: number;
  status: ReportStatus;
  /** Número de la versión vigente (empieza en 0 mientras es borrador). */
  currentVersion: number;
  title: string;
  submittedBy: string | null;
  submittedAt: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  tseNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Reporte con sus relaciones cargadas, para el detalle/builder. */
export interface MonthlyReportDetail extends MonthlyReport {
  lineItems: ReportLineItem[];
  files: ReportFile[];
  versions: ReportVersion[];
  reconciliation: ReconciliationResult;
}

// ---------------------------------------------------------------------------
// Motor de conciliación (funciones puras)
// ---------------------------------------------------------------------------

/** Tipo de discrepancia detectada al conciliar el reporte con la cadena. */
export const DiscrepancyType = {
  /** El monto declarado no coincide con el valor del bono en poder del partido. */
  AMOUNT_MISMATCH: 'amount_mismatch',
  /** El partido posee un bono que no está declarado en el reporte. */
  MISSING_BOND: 'missing_bond',
  /** El reporte referencia un bono que el partido no posee. */
  UNKNOWN_REFERENCE: 'unknown_reference',
} as const;

export type DiscrepancyType =
  (typeof DiscrepancyType)[keyof typeof DiscrepancyType];

export interface Discrepancy {
  type: DiscrepancyType;
  bondTokenId: string;
  /** Monto declarado en el reporte (null si el bono no fue declarado). */
  declaredAmount: number | null;
  /** Monto real según la tenencia on-chain (null si no se posee). */
  actualAmount: number | null;
  message: string;
}

/** Un bono declarado en una línea del reporte. */
export interface DeclaredBondRef {
  bondTokenId: string;
  amount: number;
}

/** Un bono efectivamente en poder del partido (alimentado por fixtures/DB). */
export interface HeldBond {
  bondTokenId: string;
  amount: number;
}

export interface ReconciliationResult {
  status: 'clean' | 'discrepancies';
  discrepancies: Discrepancy[];
  /** Suma de montos declarados en el reporte. */
  declaredTotal: number;
  /** Suma de montos reales de los bonos en poder del partido. */
  actualTotal: number;
  /** Cantidad de bonos que coincidieron exactamente. */
  matchedCount: number;
}

// ---------------------------------------------------------------------------
// Deadlines y cumplimiento (funciones puras)
// ---------------------------------------------------------------------------

/** Estado de cumplimiento de un período. */
export const ComplianceStatus = {
  /** Aún no vence. */
  NOT_DUE: 'not_due',
  /** Enviado antes del vencimiento. */
  ON_TIME: 'on_time',
  /** Enviado después del vencimiento pero dentro de la gracia. */
  LATE: 'late',
  /** Vencido y aún no enviado. */
  OVERDUE: 'overdue',
  /** Sin enviar y ya fuera de toda gracia. */
  MISSING: 'missing',
} as const;

export type ComplianceStatus =
  (typeof ComplianceStatus)[keyof typeof ComplianceStatus];

/** Config del calendario de vencimientos mensuales. */
export interface DeadlineConfig {
  /** Día del mes SIGUIENTE en que vence el reporte de un período. Ej: 15. */
  dueDayOfMonth: number;
  /** Días de gracia tras el vencimiento antes de considerarlo "missing". */
  graceDays: number;
}

export interface PeriodCompliance {
  periodYear: number;
  periodMonth: number;
  /** Fecha de vencimiento calculada (ISO date, YYYY-MM-DD). */
  dueDate: string;
  status: ComplianceStatus;
  /** Días hasta el vencimiento; negativo si ya pasó. null si ya se envió. */
  daysRemaining: number | null;
  submittedAt: string | null;
}
