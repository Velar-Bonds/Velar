-- VELAR: configuración y estado de escalamiento SLA de reportes (#41).
-- Escrito solo por service role; authenticated (TSE/admin) solo SELECT.

CREATE TABLE IF NOT EXISTS sla_escalation_config (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code text NOT NULL DEFAULT 'GLOBAL' UNIQUE,
  ladder       jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);

INSERT INTO sla_escalation_config (country_code, ladder)
VALUES (
  'GLOBAL',
  '[
    {"level":"level_1","afterDays":3,"notify":["tse"]},
    {"level":"level_2","afterDays":7,"notify":["tse","admin"]},
    {"level":"level_3","afterDays":14,"notify":["admin"]}
  ]'::jsonb
)
ON CONFLICT (country_code) DO NOTHING;

CREATE TABLE IF NOT EXISTS report_sla_state (
  report_id         uuid PRIMARY KEY REFERENCES reports(id) ON DELETE CASCADE,
  current_level     text NOT NULL DEFAULT 'none',
  last_escalated_at timestamptz,
  breached          boolean NOT NULL DEFAULT false,
  updated_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE sla_escalation_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_sla_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sla_escalation_config_read ON sla_escalation_config;
CREATE POLICY sla_escalation_config_read ON sla_escalation_config
  FOR SELECT TO authenticated
  USING (public.auth_role() IN ('tse', 'admin'));

DROP POLICY IF EXISTS report_sla_state_read ON report_sla_state;
CREATE POLICY report_sla_state_read ON report_sla_state
  FOR SELECT TO authenticated
  USING (public.auth_role() IN ('tse', 'admin'));
