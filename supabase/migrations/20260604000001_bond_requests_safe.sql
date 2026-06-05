-- Paso 1: Nuevos campos en bonds
ALTER TABLE bonds
  ADD COLUMN IF NOT EXISTS certificate_number text,
  ADD COLUMN IF NOT EXISTS currency           text NOT NULL DEFAULT 'CRC',
  ADD COLUMN IF NOT EXISTS interest_rate      numeric,
  ADD COLUMN IF NOT EXISTS series             text,
  ADD COLUMN IF NOT EXISTS issue_date         date,
  ADD COLUMN IF NOT EXISTS maturity_date      date;

-- Paso 2: Tabla bond_requests (sin depender de los nuevos enum values)
CREATE TABLE IF NOT EXISTS bond_requests (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id            uuid NOT NULL REFERENCES parties(id),
  requested_by        uuid NOT NULL REFERENCES profiles(id),
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
  bond_token_id       uuid REFERENCES bonds(token_id),
  reviewed_by         uuid REFERENCES profiles(id),
  reviewed_at         timestamptz,
  rejection_reason    text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- Paso 3: RLS
ALTER TABLE bond_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS bond_requests_emisor ON bond_requests;
CREATE POLICY bond_requests_emisor ON bond_requests
  FOR ALL TO authenticated
  USING (
    party_id = (SELECT party_id FROM profiles WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('tse', 'admin'))
  );
