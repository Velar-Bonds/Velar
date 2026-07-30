-- ============================================================
-- VELAR — Motor de contratos: cláusulas, plantillas y versiones — issue #38
-- ============================================================
-- Modelo estructurado y versionado del contrato de un bono: una biblioteca de
-- cláusulas reutilizables y parametrizadas, plantillas de contrato por país, y
-- versiones (revisiones publicables) de cada plantilla. La derivación del
-- resumen (ContractSummary), el ensamblado del documento y el diff entre
-- versiones son funciones puras en `apps/api/src/contracts/domain/`; esta
-- migración solo persiste los datos de entrada.
--
-- Principios de esta migración:
--   • ADITIVA: solo crea tablas nuevas y las siembra. No toca nada existente.
--   • RLS: lectura pública (el texto de una plantilla legal no es un dato
--     sensible; igual razón que `glossary_terms`, y permite que el lector de
--     contratos público en `/verificar/[id]` la use). Sin política de
--     escritura: solo `service_role` (el backend) escribe, igual que el resto
--     de las tablas administradas por el backend en este repo.
--   • Las cláusulas de la biblioteca no deberían mutarse una vez referenciadas
--     por una versión publicada — si el texto cambia, creá una cláusula nueva
--     (nuevo `clause_key`) para que el diff entre versiones siga siendo fiel
--     a lo que efectivamente se publicó.
--
-- Rollback (si te arrepentís):
--   DROP TABLE IF EXISTS public.contract_versions;
--   DROP TABLE IF EXISTS public.contract_templates;
--   DROP TABLE IF EXISTS public.contract_clauses;
--   DROP TYPE IF EXISTS public.contract_clause_category;
-- ============================================================

-- ── 1. Enum de categoría de cláusula (espeja ClauseCategory de @velar/types) ─
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contract_clause_category') THEN
    CREATE TYPE public.contract_clause_category AS ENUM (
      'partes', 'objeto', 'pago', 'transferencia', 'garantia',
      'plazo', 'incumplimiento', 'jurisdiccion', 'firmas', 'otro'
    );
  END IF;
END $$;

-- ── 2. Biblioteca de cláusulas ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.contract_clauses (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clause_key   text NOT NULL UNIQUE,
  category     public.contract_clause_category NOT NULL,
  title        text NOT NULL,
  -- Texto con tokens {{parametro}} a resolver en el ensamblado del documento.
  body_template text NOT NULL,
  parameters   text[] NOT NULL DEFAULT '{}',
  locale       text NOT NULL DEFAULT 'es',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- ── 3. Plantillas (un tipo de contrato por jurisdicción) ─────
CREATE TABLE IF NOT EXISTS public.contract_templates (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key         text NOT NULL UNIQUE,
  country     text NOT NULL CHECK (country IN ('CR', 'CO', 'BR', 'AR')),
  name        text NOT NULL,
  description text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contract_templates_country ON public.contract_templates(country);

-- ── 4. Versiones (revisión publicable de una plantilla) ──────
CREATE TABLE IF NOT EXISTS public.contract_versions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id    uuid NOT NULL REFERENCES public.contract_templates(id) ON DELETE CASCADE,
  version_number int NOT NULL,
  status         text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  -- Orden lógico de contract_clauses.clause_key que compone esta versión.
  clause_keys    text[] NOT NULL DEFAULT '{}',
  notes          text,
  created_by     uuid REFERENCES public.profiles(id),
  created_at     timestamptz NOT NULL DEFAULT now(),
  published_at   timestamptz,
  UNIQUE (template_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_contract_versions_template ON public.contract_versions(template_id);

-- ── 5. updated_at automático (reutiliza set_updated_at de la migración inicial) ─
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_contract_clauses_updated_at'
  ) THEN
    CREATE TRIGGER trg_contract_clauses_updated_at
      BEFORE UPDATE ON public.contract_clauses
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_contract_templates_updated_at'
  ) THEN
    CREATE TRIGGER trg_contract_templates_updated_at
      BEFORE UPDATE ON public.contract_templates
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

-- ── 6. RLS: lectura pública, escritura solo service_role ─────
ALTER TABLE public.contract_clauses   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_versions  ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'contract_clauses' AND policyname = 'contract_clauses_public_read'
  ) THEN
    CREATE POLICY "contract_clauses_public_read" ON public.contract_clauses FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'contract_templates' AND policyname = 'contract_templates_public_read'
  ) THEN
    CREATE POLICY "contract_templates_public_read" ON public.contract_templates FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'contract_versions' AND policyname = 'contract_versions_public_read'
  ) THEN
    CREATE POLICY "contract_versions_public_read" ON public.contract_versions FOR SELECT USING (true);
  END IF;
END $$;

-- ── 7. Semilla (idempotente) ──────────────────────────────────
-- Costa Rica: mismas 5 cláusulas (mismo texto legal) que el fixture que #39
-- usaba como stand-in, para que el lector de contratos no cambie de
-- comportamiento al pasar de fixture a datos reales.
INSERT INTO public.contract_clauses (clause_key, category, title, body_template, parameters, locale) VALUES
  ('clause-partes', 'partes', 'Cláusula 1 — Partes',
   'Comparecen, por una parte, {{sellerName}} (en adelante, el "Vendedor"), y por otra parte, {{buyerName}} (en adelante, el "Comprador").',
   ARRAY['sellerName','buyerName'], 'es'),
  ('clause-objeto', 'objeto', 'Cláusula 2 — Objeto',
   'El presente contrato tiene por objeto la transferencia de la titularidad del bono político tokenizado {{bondId}}, representado por el token {{tokenId}} en la red Stellar, del Vendedor al Comprador.',
   ARRAY['bondId','tokenId'], 'es'),
  ('clause-pago', 'pago', 'Cláusula 3 — Precio y forma de pago',
   'El precio de la transferencia será {{amount}} {{currency}}, pagadero por el Comprador mediante {{paymentMethod}}, quedando registrada la evidencia del pago en el sistema.',
   ARRAY['amount','currency','paymentMethod'], 'es'),
  ('clause-garantia', 'garantia', 'Cláusula 4 — Custodia en escrow',
   'El token permanecerá bajo custodia en un escrow on-chain (Trustless Work) desde la aceptación de la oferta y hasta que el Vendedor confirme la recepción del pago, momento en el cual el token será liberado a favor del Comprador.',
   ARRAY[]::text[], 'es'),
  ('clause-jurisdiccion', 'jurisdiccion', 'Cláusula 5 — Jurisdicción',
   'Este contrato se rige por las leyes de {{jurisdiction}} y por la supervisión de {{authority}} en lo que corresponda.',
   ARRAY['jurisdiction','authority'], 'es'),
  -- Colombia: cláusulas propias de la cesión de reposición de votos (segundo
  -- país, para ejercer de verdad el soporte multi-país del motor).
  ('clause-co-partes', 'partes', 'Cláusula 1 — Partes',
   'Comparecen, por una parte, {{sellerName}} (en adelante, el "Cedente"), y por otra parte, {{buyerName}} (en adelante, el "Cesionario").',
   ARRAY['sellerName','buyerName'], 'es'),
  ('clause-co-objeto', 'objeto', 'Cláusula 2 — Objeto',
   'El presente contrato tiene por objeto la cesión del derecho a la reposición de votos {{bondId}}, representado por el token {{tokenId}} en la red Stellar, del Cedente al Cesionario.',
   ARRAY['bondId','tokenId'], 'es'),
  ('clause-co-pago', 'pago', 'Cláusula 3 — Precio y forma de pago',
   'El precio de la cesión será {{amount}} {{currency}}, pagadero por el Cesionario mediante {{paymentMethod}}, quedando registrada la evidencia del pago en el sistema.',
   ARRAY['amount','currency','paymentMethod'], 'es'),
  ('clause-co-jurisdiccion', 'jurisdiccion', 'Cláusula 4 — Jurisdicción',
   'Este contrato se rige por las leyes de {{jurisdiction}} y por la supervisión de {{authority}} en lo que corresponda.',
   ARRAY['jurisdiction','authority'], 'es')
ON CONFLICT (clause_key) DO NOTHING;

INSERT INTO public.contract_templates (id, key, country, name, description) VALUES
  ('00000000-0000-4000-8000-000000000001', 'bond-transfer-cr', 'CR',
   'Contrato de transferencia de bono político — Costa Rica',
   'Plantilla estándar de transferencia de bonos de deuda política costarricenses.'),
  ('00000000-0000-4000-8000-000000000002', 'cession-transfer-co', 'CO',
   'Contrato de cesión de reposición de votos — Colombia',
   'Plantilla estándar de cesión de reposición de votos colombiana.')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.contract_versions (template_id, version_number, status, clause_keys, notes, published_at) VALUES
  ('00000000-0000-4000-8000-000000000001', 1, 'published',
   ARRAY['clause-partes','clause-objeto','clause-pago','clause-garantia','clause-jurisdiccion'],
   'Versión inicial.', now()),
  ('00000000-0000-4000-8000-000000000002', 1, 'published',
   ARRAY['clause-co-partes','clause-co-objeto','clause-co-pago','clause-co-jurisdiccion'],
   'Versión inicial.', now())
ON CONFLICT (template_id, version_number) DO NOTHING;
