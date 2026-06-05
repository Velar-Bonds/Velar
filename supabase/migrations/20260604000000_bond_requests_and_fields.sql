-- ============================================================
-- VELAR — Bond requests (solicitudes de partido) + campos del bono
-- ============================================================

-- Nuevos campos en bonds (info completa del certificado)
ALTER TABLE bonds
  ADD COLUMN IF NOT EXISTS certificate_number text,
  ADD COLUMN IF NOT EXISTS currency           text NOT NULL DEFAULT 'CRC',
  ADD COLUMN IF NOT EXISTS interest_rate      numeric,
  ADD COLUMN IF NOT EXISTS series             text,
  ADD COLUMN IF NOT EXISTS issue_date         date,
  ADD COLUMN IF NOT EXISTS maturity_date      date;

-- Status del bono: agrega pendiente y aprobado para el flujo de solicitud
ALTER TYPE bond_status ADD VALUE IF NOT EXISTS 'pendiente';
ALTER TYPE bond_status ADD VALUE IF NOT EXISTS 'aprobado';
ALTER TYPE bond_status ADD VALUE IF NOT EXISTS 'rechazado';

-- Tabla de solicitudes: el partido llena el formulario, el TSE aprueba/rechaza
CREATE TABLE IF NOT EXISTS bond_requests (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id            uuid NOT NULL REFERENCES parties(id),
  requested_by        uuid NOT NULL REFERENCES profiles(id),

  -- Campos del certificado
  certificate_number  text,
  face_value          numeric NOT NULL,
  currency            text NOT NULL DEFAULT 'CRC',
  interest_rate       numeric,
  series              text,
  issue_date          date,
  maturity_date       date,
  notes               text,

  status              text NOT NULL DEFAULT 'pendiente'
                        CHECK (status IN ('pendiente', 'aprobado', 'rechazado')),

  -- Si fue aprobada, referencia al bono creado
  bond_token_id       uuid REFERENCES bonds(token_id),
  reviewed_by         uuid REFERENCES profiles(id),
  reviewed_at         timestamptz,
  rejection_reason    text,

  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- RLS: emisor ve solo las solicitudes de su partido
ALTER TABLE bond_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY bond_requests_emisor ON bond_requests
  FOR ALL TO authenticated
  USING (
    party_id = (SELECT party_id FROM profiles WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('tse', 'admin'))
  );
