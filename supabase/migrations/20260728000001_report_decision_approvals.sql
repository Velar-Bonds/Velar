-- VELAR: doble aprobación de decisiones TSE sobre reportes (#41).
-- Escrito solo por service role (API); authenticated solo lee (TSE/admin).

CREATE TABLE IF NOT EXISTS report_decision_approvals (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id          uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  decision           text NOT NULL DEFAULT 'aprobado',
  first_approver_id  uuid NOT NULL REFERENCES profiles(id),
  first_approved_at  timestamptz NOT NULL DEFAULT now(),
  second_approver_id uuid REFERENCES profiles(id),
  second_approved_at timestamptz,
  status             text NOT NULL DEFAULT 'pending_second'
                       CHECK (status IN ('pending_second', 'completed')),
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_report_decision_approvals_report
  ON report_decision_approvals(report_id);

ALTER TABLE report_decision_approvals ENABLE ROW LEVEL SECURITY;

-- Lectura TSE/admin. Sin política INSERT/UPDATE para authenticated:
-- el backend escribe con service role (bypass RLS), igual que report_versions.
DROP POLICY IF EXISTS report_decision_approvals_read ON report_decision_approvals;
CREATE POLICY report_decision_approvals_read ON report_decision_approvals
  FOR SELECT TO authenticated
  USING (public.auth_role() IN ('tse', 'admin'));
