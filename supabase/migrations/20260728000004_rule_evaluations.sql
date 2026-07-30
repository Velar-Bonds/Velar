-- VELAR: evaluaciones de reglas de compliance sobre reportes (#41).
-- Append-only; escrito por service role; TSE/admin solo SELECT.

CREATE TABLE IF NOT EXISTS rule_evaluations (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id        uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  rule_set_version text NOT NULL,
  findings         jsonb NOT NULL DEFAULT '[]'::jsonb,
  overall_severity text NOT NULL,
  evaluated_at     timestamptz NOT NULL DEFAULT now(),
  evaluated_by     uuid REFERENCES profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_rule_evaluations_report
  ON rule_evaluations(report_id);

-- Append-only: una evaluación nunca se edita ni borra (igual que report_versions).
CREATE OR REPLACE FUNCTION deny_rule_evaluation_mutation()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'rule_evaluations is append-only: % not allowed', TG_OP;
END;
$$;
DROP TRIGGER IF EXISTS trg_rule_evaluations_immutable ON rule_evaluations;
CREATE TRIGGER trg_rule_evaluations_immutable
  BEFORE UPDATE OR DELETE ON rule_evaluations
  FOR EACH ROW EXECUTE FUNCTION deny_rule_evaluation_mutation();

ALTER TABLE rule_evaluations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rule_evaluations_read ON rule_evaluations;
CREATE POLICY rule_evaluations_read ON rule_evaluations
  FOR SELECT TO authenticated
  USING (public.auth_role() IN ('tse', 'admin'));
