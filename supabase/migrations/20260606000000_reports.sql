-- VELAR: reportes que el partido envía al TSE sobre sus bonos.

CREATE TABLE IF NOT EXISTS reports (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id      uuid NOT NULL REFERENCES parties(id),
  submitted_by  uuid NOT NULL REFERENCES profiles(id),

  title         text NOT NULL,
  description   text NOT NULL,
  period_start  date,
  period_end    date,
  bond_token_ids uuid[],          -- bonos asociados al reporte (opcional)
  total_amount  numeric,          -- monto total reportado (opcional)
  attachments   jsonb,            -- referencias a archivos en Storage

  status        text NOT NULL DEFAULT 'enviado'
                  CHECK (status IN ('enviado', 'revisado', 'observado', 'aprobado')),

  reviewed_by   uuid REFERENCES profiles(id),
  reviewed_at   timestamptz,
  tse_notes     text,             -- comentarios del TSE

  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reports_party    ON reports(party_id);
CREATE INDEX IF NOT EXISTS idx_reports_status   ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created  ON reports(created_at DESC);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS reports_party_or_tse ON reports;
CREATE POLICY reports_party_or_tse ON reports
  FOR ALL TO authenticated
  USING (
    party_id = (SELECT party_id FROM profiles WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('tse', 'admin'))
  );
