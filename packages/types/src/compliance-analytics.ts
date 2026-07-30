/**
 * Analytics de cumplimiento y proyecciones para el command center TSE.
 *
 * Métricas agregadas por partido, carga de revisores, panorama general
 * y forecast de reportes en riesgo de vencimiento.
 */

// ---------------------------------------------------------------------------
// Métricas por partido
// ---------------------------------------------------------------------------

export interface PartyComplianceMetric {
  partyId: string;
  partyName: string;
  totalPeriods: number;
  onTimeCount: number;
  lateCount: number;
  overdueCount: number;
  missingCount: number;
  complianceRate: number;
}

// ---------------------------------------------------------------------------
// Carga de revisores
// ---------------------------------------------------------------------------

export interface ReviewerWorkload {
  reviewerId: string;
  reviewerName: string;
  assignedCount: number;
  decidedCount: number;
  avgDecisionHours: number | null;
  slaAttainmentRate: number;
}

// ---------------------------------------------------------------------------
// Panorama general
// ---------------------------------------------------------------------------

export interface ComplianceOverview {
  totalReports: number;
  onTimeRate: number;
  overdueCount: number;
  atRiskCount: number;
  missingCount: number;
}

// ---------------------------------------------------------------------------
// Forecast
// ---------------------------------------------------------------------------

export interface ComplianceForecastPoint {
  periodYear: number;
  periodMonth: number;
  projectedOverdue: number;
}

export interface ComplianceForecast {
  method: 'linear_trend' | 'moving_average';
  horizonMonths: number;
  points: ComplianceForecastPoint[];
}
