-- ============================================================
-- VELAR — Multi-país (LATAM)
-- ============================================================
-- Agrega la dimensión `country` para convertir VELAR de una plataforma
-- CR-only a infraestructura multi-país (multi-tenant por país).
--
-- Principios de esta migración:
--   • ADITIVA: solo agrega columnas/datos. No borra ni altera nada existente.
--   • REVERSIBLE: el bloque de rollback al final deshace todo.
--   • SEGURA POR DEFAULT: todas las filas existentes quedan en 'CR', así que
--     el comportamiento actual no cambia.
--
-- Rollback (si te arrepentís):
--   ALTER TABLE parties  DROP COLUMN IF EXISTS country;
--   ALTER TABLE profiles DROP COLUMN IF EXISTS country;
--   ALTER TABLE bonds    DROP COLUMN IF EXISTS country;
--   DELETE FROM parties WHERE country <> 'CR';
--   (y restaurar handle_new_user a su versión anterior si hiciera falta)
-- ============================================================

-- ── 1. Columna country (default 'CR' → no rompe nada existente) ──
ALTER TABLE parties  ADD COLUMN IF NOT EXISTS country text NOT NULL DEFAULT 'CR';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country text NOT NULL DEFAULT 'CR';
ALTER TABLE bonds    ADD COLUMN IF NOT EXISTS country text NOT NULL DEFAULT 'CR';

-- Países soportados. CHECK suave para evitar basura, fácil de extender.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'parties_country_chk') THEN
    ALTER TABLE parties  ADD CONSTRAINT parties_country_chk  CHECK (country IN ('CR','CO','BR','AR'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_country_chk') THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_country_chk CHECK (country IN ('CR','CO','BR','AR'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bonds_country_chk') THEN
    ALTER TABLE bonds    ADD CONSTRAINT bonds_country_chk    CHECK (country IN ('CR','CO','BR','AR'));
  END IF;
END $$;

-- ── 2. Índices para filtrar por país ────────────────────────
CREATE INDEX IF NOT EXISTS idx_parties_country  ON parties(country);
CREATE INDEX IF NOT EXISTS idx_profiles_country ON profiles(country);
CREATE INDEX IF NOT EXISTS idx_bonds_country    ON bonds(country);

-- ── 3. handle_new_user: copia el país desde la metadata del signup ──
-- (default 'CR' si no viene, para no romper signups existentes)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, country)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'comprador'),
    COALESCE(NEW.raw_user_meta_data->>'country', 'CR')
  );
  RETURN NEW;
END;
$$;

-- ── 4. Seed: partidos por país (para que el demo tenga datos) ──
-- Los códigos de partido son UNIQUE globalmente; usamos códigos reales.
-- CR ya existe (PLN, PUSC, PAC, FA, PRN) y queda en 'CR' por el default.
INSERT INTO parties (code, name, country) VALUES
  -- 🇨🇴 Colombia — autoridad: CNE. Instrumento: cesión de reposición de votos.
  ('CO-PH',   'Pacto Histórico',                 'CO'),
  ('CO-CD',   'Centro Democrático',              'CO'),
  ('CO-PL',   'Partido Liberal Colombiano',      'CO'),
  ('CO-CR',   'Cambio Radical',                  'CO'),
  -- 🇧🇷 Brasil — autoridad: TSE. Instrumento: cota do Fundo Eleitoral (FEFC).
  ('BR-PT',   'Partido dos Trabalhadores',       'BR'),
  ('BR-PL',   'Partido Liberal',                 'BR'),
  ('BR-UB',   'União Brasil',                    'BR'),
  ('BR-PSDB', 'Partido da Social Democracia Brasileira', 'BR'),
  -- 🇦🇷 Argentina — autoridad: CNE (Cámara Nacional Electoral). Aporte de campaña.
  ('AR-UXP',  'Unión por la Patria',             'AR'),
  ('AR-LLA',  'La Libertad Avanza',              'AR'),
  ('AR-PRO',  'Propuesta Republicana (PRO)',     'AR'),
  ('AR-UCR',  'Unión Cívica Radical',            'AR')
ON CONFLICT (code) DO NOTHING;

-- ── 5. RLS: visibilidad pública de parties ya existe ('parties_read').
--    El aislamiento por país en lecturas de bonos lo aplica el backend
--    (service_role) en la capa de servicio. La compra cross-border se
--    bloquea en transfers.service (buyer.country === bond.country).
-- ============================================================
