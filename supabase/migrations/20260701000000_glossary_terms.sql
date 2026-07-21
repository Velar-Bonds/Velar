-- ============================================================
-- VELAR — Glosario de términos (contract reader) — issue #39
-- ============================================================
-- Tabla de términos + definiciones en lenguaje simple (i18n) que alimenta el
-- glosario del lector de contratos. Los términos NO son datos sensibles: son
-- definiciones públicas que ayudan a cualquiera a entender el contrato.
--
-- Principios de esta migración:
--   • ADITIVA: solo crea una tabla nueva y la siembra. No toca nada existente.
--   • APPEND-ONLY: no modifica migraciones ya aplicadas.
--   • SEGURA: lectura pública (RLS `USING (true)`), escritura solo backend
--     (service_role, que hace bypass de RLS). Sin secretos.
--
-- Rollback (si te arrepentís):
--   DROP TABLE IF EXISTS public.glossary_terms;
-- ============================================================

-- ── 1. Tabla ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.glossary_terms (
  id          text PRIMARY KEY,
  term        text NOT NULL,
  definition  text NOT NULL,
  locale      text NOT NULL DEFAULT 'es',
  aliases     text[] NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_glossary_terms_locale ON public.glossary_terms(locale);

-- ── 2. RLS: lectura pública, escritura solo service_role ────
ALTER TABLE public.glossary_terms ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'glossary_terms'
      AND policyname = 'glossary_terms_public_read'
  ) THEN
    CREATE POLICY "glossary_terms_public_read" ON public.glossary_terms
      FOR SELECT USING (true);
  END IF;
END $$;

-- ── 3. Semilla (idempotente) ────────────────────────────────
-- Definiciones base en español. Ampliables con futuras migraciones append-only.
INSERT INTO public.glossary_terms (id, term, definition, locale, aliases) VALUES
  ('g-escrow', 'escrow',
   'Un depósito en garantía: el token queda retenido por un tercero neutral (un contrato en la blockchain) hasta que se cumplan las condiciones acordadas, como la confirmación del pago.',
   'es', ARRAY['custodia','depósito en garantía']),
  ('g-token', 'token',
   'La representación digital única del bono en la red Stellar.',
   'es', ARRAY['token del bono']),
  ('g-sinpe', 'SINPE',
   'Sistema Nacional de Pagos Electrónicos de Costa Rica, usado para transferencias de dinero entre cuentas.',
   'es', ARRAY[]::text[]),
  ('g-titularidad', 'titularidad',
   'La condición de ser el dueño legal del bono.',
   'es', ARRAY['titular']),
  ('g-tse', 'TSE',
   'Tribunal Supremo de Elecciones: la institución que emite los bonos, supervisa las transferencias y audita el historial.',
   'es', ARRAY[]::text[])
ON CONFLICT (id) DO NOTHING;
