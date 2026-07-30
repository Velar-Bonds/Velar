-- VELAR: ciclo de vida completo del reporte mensual del partido al TSE.
-- EXTIENDE `reports` (que solo guardaba metadata de texto libre) a un reporte
-- estructurado, versionado, con archivos y conciliación contra los bonos que el
-- partido posee on-chain. Append-only en las versiones. NO reescribe lógica
-- existente (docs/AGENTS.md §3).

-- ── 1. Estados del workflow + campos de período/versión ────────────────────
-- reports.status es un CHECK de texto: lo ampliamos conservando los estados ya
-- usados ('enviado','revisado','observado','aprobado').
ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_status_check;
ALTER TABLE reports
  ADD CONSTRAINT reports_status_check
  CHECK (status IN (
    'borrador', 'enviado', 'en_revision', 'revisado',
    'observado', 'reenviado', 'aprobado'
  ));

ALTER TABLE reports ADD COLUMN IF NOT EXISTS period_year     int;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS period_month    int
  CHECK (period_month IS NULL OR period_month BETWEEN 1 AND 12);
ALTER TABLE reports ADD COLUMN IF NOT EXISTS current_version int NOT NULL DEFAULT 0;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS submitted_at    timestamptz;

-- Un partido tiene a lo sumo un reporte por período.
CREATE UNIQUE INDEX IF NOT EXISTS uq_reports_party_period
  ON reports(party_id, period_year, period_month)
  WHERE period_year IS NOT NULL AND period_month IS NOT NULL;

-- ── 2. Líneas del reporte ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS report_line_items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id     uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  concept       text NOT NULL,
  amount        numeric NOT NULL DEFAULT 0,
  category      text NOT NULL DEFAULT 'otro'
                  CHECK (category IN ('ingreso', 'egreso', 'donacion', 'bono', 'otro')),
  bond_token_id uuid,   -- referencia declarada a un bono (opcional)
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_report_line_items_report ON report_line_items(report_id);

-- ── 3. Archivos adjuntos (metadata; el binario vive en Storage) ────────────
CREATE TABLE IF NOT EXISTS report_files (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id   uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  file_path   text NOT NULL,          -- ruta dentro del bucket privado
  file_name   text NOT NULL,
  mime_type   text NOT NULL,
  size_bytes  bigint NOT NULL DEFAULT 0,
  checksum    text NOT NULL,          -- sha-256 en hex
  scan_status text NOT NULL DEFAULT 'pending'
                CHECK (scan_status IN ('pending', 'clean', 'infected')),
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_report_files_report ON report_files(report_id);

-- ── 4. Versiones inmutables (snapshot por envío) ───────────────────────────
CREATE TABLE IF NOT EXISTS report_versions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id  uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  version    int NOT NULL,
  status     text NOT NULL,
  snapshot   jsonb NOT NULL,          -- foto completa del reporte al enviar
  created_by uuid NOT NULL REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (report_id, version)
);
CREATE INDEX IF NOT EXISTS idx_report_versions_report ON report_versions(report_id);

-- Append-only: una versión enviada nunca se edita ni borra (igual que audit_events).
CREATE OR REPLACE FUNCTION deny_report_version_mutation()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'report_versions is append-only: % not allowed', TG_OP;
END;
$$;
DROP TRIGGER IF EXISTS trg_report_versions_immutable ON report_versions;
CREATE TRIGGER trg_report_versions_immutable
  BEFORE UPDATE OR DELETE ON report_versions
  FOR EACH ROW EXECUTE FUNCTION deny_report_version_mutation();

-- ── 5. Config de vencimientos mensuales ────────────────────────────────────
CREATE TABLE IF NOT EXISTS report_deadlines (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code     text NOT NULL DEFAULT 'GLOBAL',  -- 'GLOBAL' = default; o CR/CO/BR/AR
  due_day_of_month int  NOT NULL DEFAULT 15 CHECK (due_day_of_month BETWEEN 1 AND 28),
  grace_days       int  NOT NULL DEFAULT 5  CHECK (grace_days >= 0),
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (country_code)
);
INSERT INTO report_deadlines (country_code, due_day_of_month, grace_days)
VALUES ('GLOBAL', 15, 5)
ON CONFLICT (country_code) DO NOTHING;

-- ── 6. RLS: el partido ve solo lo suyo; TSE/admin ven todo ─────────────────
ALTER TABLE report_line_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS report_line_items_access ON report_line_items;
CREATE POLICY report_line_items_access ON report_line_items
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM reports r
      WHERE r.id = report_line_items.report_id
        AND (
          r.party_id = (SELECT party_id FROM profiles WHERE id = auth.uid())
          OR public.auth_role() IN ('tse', 'admin')
        )
    )
  );

ALTER TABLE report_files ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS report_files_access ON report_files;
CREATE POLICY report_files_access ON report_files
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM reports r
      WHERE r.id = report_files.report_id
        AND (
          r.party_id = (SELECT party_id FROM profiles WHERE id = auth.uid())
          OR public.auth_role() IN ('tse', 'admin')
        )
    )
  );

ALTER TABLE report_versions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS report_versions_read ON report_versions;
CREATE POLICY report_versions_read ON report_versions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM reports r
      WHERE r.id = report_versions.report_id
        AND (
          r.party_id = (SELECT party_id FROM profiles WHERE id = auth.uid())
          OR public.auth_role() IN ('tse', 'admin')
        )
    )
  );

ALTER TABLE report_deadlines ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS report_deadlines_read ON report_deadlines;
CREATE POLICY report_deadlines_read ON report_deadlines
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS report_deadlines_admin ON report_deadlines;
CREATE POLICY report_deadlines_admin ON report_deadlines
  FOR ALL TO authenticated
  USING (public.auth_role() IN ('tse', 'admin'));

-- ── 7. Bucket privado para archivos de reporte ─────────────────────────────
-- Convención de ruta: <party_id>/<report_id>/<file_name>
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'report-files',
  'report-files',
  false,
  10485760,  -- 10 MB
  ARRAY[
    'application/pdf',
    'text/csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/png',
    'image/jpeg'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Solo el partido dueño (rol emisor) puede subir a su carpeta.
DROP POLICY IF EXISTS "party_can_upload_report_file" ON storage.objects;
CREATE POLICY "party_can_upload_report_file"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'report-files'
    AND public.auth_role() = 'emisor'
    AND split_part(name, '/', 1) = (SELECT party_id::text FROM profiles WHERE id = auth.uid())
  );

-- El partido dueño o el TSE/admin pueden descargar.
DROP POLICY IF EXISTS "party_or_tse_can_download_report_file" ON storage.objects;
CREATE POLICY "party_or_tse_can_download_report_file"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'report-files'
    AND (
      public.auth_role() IN ('tse', 'admin')
      OR split_part(name, '/', 1) = (SELECT party_id::text FROM profiles WHERE id = auth.uid())
    )
  );

-- ── 8. Nuevos eventos de auditoría ─────────────────────────────────────────
ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS 'report_submitted';
ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS 'report_resubmitted';
ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS 'report_version_created';
ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS 'report_observed';
ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS 'report_approved';
ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS 'report_file_uploaded';
