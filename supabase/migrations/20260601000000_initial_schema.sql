-- ============================================================
-- VELAR — Initial Schema
-- ============================================================

-- ── Enums ────────────────────────────────────────────────────
CREATE TYPE user_role AS ENUM (
  'tse', 'emisor', 'comprador', 'recomprador', 'validador', 'admin'
);

CREATE TYPE bond_status AS ENUM (
  'emitido', 'activo', 'en_escrow', 'transferido', 'cancelado', 'congelado'
);

CREATE TYPE transfer_status AS ENUM (
  'solicitada', 'aceptada', 'en_escrow',
  'pago_registrado', 'pago_validado', 'liberada',
  'rechazada', 'cancelada'
);

CREATE TYPE audit_event_type AS ENUM (
  'bond_emitido', 'bond_asignado',
  'transfer_solicitada', 'transfer_aceptada',
  'escrow_bloqueado', 'pago_registrado', 'pago_validado',
  'token_liberado', 'transfer_rechazada', 'transfer_cancelada',
  'bond_congelado', 'bond_descongelado', 'bond_cancelado'
);

-- ── Parties ──────────────────────────────────────────────────
CREATE TABLE parties (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code       text NOT NULL UNIQUE,
  name       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── Profiles (extends auth.users) ────────────────────────────
CREATE TABLE profiles (
  id             uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email          text NOT NULL,
  full_name      text,
  role           user_role NOT NULL DEFAULT 'comprador',
  party_id       uuid REFERENCES parties(id),
  stellar_wallet text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- ── Bonds ────────────────────────────────────────────────────
CREATE TABLE bonds (
  token_id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bond_id         text NOT NULL UNIQUE,
  issuer_party_id uuid NOT NULL REFERENCES parties(id),
  current_owner   uuid REFERENCES profiles(id),
  status          bond_status NOT NULL DEFAULT 'emitido',
  document_hash   text NOT NULL,
  metadata_uri    text,
  face_value      numeric,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ── Transfers ────────────────────────────────────────────────
CREATE TABLE transfers (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bond_token_id         uuid NOT NULL REFERENCES bonds(token_id),
  from_owner            uuid NOT NULL REFERENCES profiles(id),
  to_owner              uuid NOT NULL REFERENCES profiles(id),
  status                transfer_status NOT NULL DEFAULT 'solicitada',
  escrow_contract_id    text,
  payment_evidence_hash text,
  validated_by          uuid REFERENCES profiles(id),
  amount                numeric,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- ── Audit Events (append-only) ───────────────────────────────
CREATE TABLE audit_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bond_token_id uuid REFERENCES bonds(token_id),
  transfer_id   uuid REFERENCES transfers(id),
  type          audit_event_type NOT NULL,
  actor_id      uuid REFERENCES profiles(id),
  payload       jsonb NOT NULL DEFAULT '{}',
  tx_hash       text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ── Triggers: updated_at ─────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_bonds_updated_at
  BEFORE UPDATE ON bonds
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_transfers_updated_at
  BEFORE UPDATE ON transfers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Trigger: block UPDATE/DELETE on audit_events ─────────────
CREATE OR REPLACE FUNCTION deny_audit_mutation()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'audit_events is append-only: % not allowed', TG_OP;
END;
$$;

CREATE TRIGGER trg_audit_events_immutable
  BEFORE UPDATE OR DELETE ON audit_events
  FOR EACH ROW EXECUTE FUNCTION deny_audit_mutation();

-- ── Auto-create profile on sign-up ───────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'comprador')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── Indexes ──────────────────────────────────────────────────
CREATE INDEX idx_bonds_current_owner  ON bonds(current_owner);
CREATE INDEX idx_bonds_issuer_party   ON bonds(issuer_party_id);
CREATE INDEX idx_bonds_status         ON bonds(status);
CREATE INDEX idx_transfers_bond       ON transfers(bond_token_id);
CREATE INDEX idx_transfers_from       ON transfers(from_owner);
CREATE INDEX idx_transfers_to         ON transfers(to_owner);
CREATE INDEX idx_transfers_status     ON transfers(status);
CREATE INDEX idx_audit_bond           ON audit_events(bond_token_id);
CREATE INDEX idx_audit_transfer       ON audit_events(transfer_id);
CREATE INDEX idx_audit_type           ON audit_events(type);

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE parties      ENABLE ROW LEVEL SECURITY;
ALTER TABLE bonds        ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfers    ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_self" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_tse_admin" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('tse','admin'))
  );

CREATE POLICY "profiles_self_update" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "parties_read" ON parties
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "parties_admin_write" ON parties
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "bonds_owner" ON bonds
  FOR SELECT USING (current_owner = auth.uid());

CREATE POLICY "bonds_emisor" ON bonds
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN parties pt ON pt.id = p.party_id
      WHERE p.id = auth.uid() AND p.role = 'emisor' AND pt.id = issuer_party_id
    )
  );

CREATE POLICY "bonds_tse_admin" ON bonds
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('tse','admin'))
  );

CREATE POLICY "transfers_parties" ON transfers
  FOR SELECT USING (from_owner = auth.uid() OR to_owner = auth.uid());

CREATE POLICY "transfers_validador" ON transfers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'validador')
    AND status IN ('pago_registrado','pago_validado')
  );

CREATE POLICY "transfers_tse_admin" ON transfers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('tse','admin'))
  );

CREATE POLICY "audit_tse_admin" ON audit_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('tse','admin'))
  );

CREATE POLICY "audit_own_bonds" ON audit_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bonds b
      WHERE b.token_id = bond_token_id AND b.current_owner = auth.uid()
    )
  );

CREATE POLICY "audit_insert" ON audit_events
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ── Seed: initial parties ─────────────────────────────────────
INSERT INTO parties (code, name) VALUES
  ('PLN',  'Partido Liberación Nacional'),
  ('PUSC', 'Partido Unidad Social Cristiana'),
  ('PAC',  'Partido Acción Ciudadana'),
  ('FA',   'Frente Amplio'),
  ('PRN',  'Partido Republicano Nacional');
