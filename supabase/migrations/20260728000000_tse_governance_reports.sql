-- VELAR: TSE governance — estados de decisión + cola de revisión asignable.
-- Extiende el ciclo de vida del reporte (#41) sin reescribir lógica existente.

-- ── 1. Estados: rechazado + pendiente de segunda aprobación ────────────────
ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_status_check;
ALTER TABLE reports
  ADD CONSTRAINT reports_status_check
  CHECK (status IN (
    'borrador', 'enviado', 'en_revision', 'revisado',
    'observado', 'reenviado', 'aprobado',
    'rechazado', 'pendiente_segunda_aprobacion'
  ));

-- ── 2. Revisor asignable (cola de revisión TSE) ────────────────────────────
ALTER TABLE reports ADD COLUMN IF NOT EXISTS assigned_reviewer_id uuid REFERENCES profiles(id);

CREATE INDEX IF NOT EXISTS idx_reports_assigned_reviewer
  ON reports(assigned_reviewer_id);

-- Ya existe desde 20260606000000_reports.sql; IF NOT EXISTS lo hace idempotente.
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
