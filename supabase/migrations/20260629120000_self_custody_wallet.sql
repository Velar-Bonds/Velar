-- ============================================================
-- VELAR — Wallet self-custody vinculada al perfil
-- ============================================================
-- Permite que un usuario vincule SU PROPIA wallet de Stellar (la que controla
-- desde Freighter) a su perfil, como base para el flujo no-custodial.
--
-- Es independiente de `stellar_wallet` (la wallet de CUSTODIA ASISTIDA que crea
-- el backend): esa no se toca y sigue siendo el default de la demo.
--
-- Principios:
--   • ADITIVA: solo agrega una columna nullable. No rompe nada existente.
--   • REVERSIBLE: ver bloque de rollback al final.
--
-- Rollback:
--   ALTER TABLE profiles DROP COLUMN IF EXISTS stellar_public_key;
-- ============================================================

-- ── 1. Columna para la llave pública self-custody (G..., 56 chars) ──
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stellar_public_key text;

-- CHECK suave de formato (ed25519 público de Stellar: 'G' + 55 base32).
-- NULL permitido (la mayoría de usuarios usan custodia asistida).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_stellar_public_key_chk') THEN
    ALTER TABLE profiles
      ADD CONSTRAINT profiles_stellar_public_key_chk
      CHECK (stellar_public_key IS NULL OR stellar_public_key ~ '^G[A-Z2-7]{55}$');
  END IF;
END $$;

-- ── 2. RLS ──────────────────────────────────────────────────
-- La política existente `profiles_self_update` (FOR UPDATE USING auth.uid() = id)
-- ya cubre que el usuario actualice su propia fila, incluida esta columna.
-- El endpoint del backend usa service_role (bypassa RLS) igualmente.
-- Reforzamos el WITH CHECK del self-update por si se accede directo desde el front.
DROP POLICY IF EXISTS "profiles_self_update_wallet" ON profiles;
CREATE POLICY "profiles_self_update_wallet" ON profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
-- ============================================================
