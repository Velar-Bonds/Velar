-- ============================================================
-- VELAR — Métodos de pago aceptados por bono
-- ============================================================
-- El DUEÑO del bono elige qué métodos de pago acepta al publicarlo en el
-- marketplace:
--   • 'sinpe'         → pago P2P por SINPE Móvil (off-chain, evidencia + escrow)
--   • 'transferencia' → pago P2P por transferencia bancaria (off-chain)
--   • 'wallet'        → liquidación atómica on-chain (USDC) con wallet propia
--
-- El comprador usa el flujo correspondiente al método elegido. El flujo P2P
-- existente (oferta → escrow → registrar pago → confirmar) cubre sinpe/
-- transferencia; 'wallet' habilita la compra instantánea atómica (DvP).
--
-- Principios: ADITIVA (columna nullable con default), REVERSIBLE.
-- Rollback:
--   ALTER TABLE bonds DROP COLUMN IF EXISTS payment_methods;
-- ============================================================

ALTER TABLE bonds
  ADD COLUMN IF NOT EXISTS payment_methods text[] NOT NULL DEFAULT '{sinpe,transferencia}';

-- CHECK suave: cada elemento debe ser un método conocido.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bonds_payment_methods_chk') THEN
    ALTER TABLE bonds
      ADD CONSTRAINT bonds_payment_methods_chk
      CHECK (payment_methods <@ ARRAY['sinpe','transferencia','wallet']::text[]);
  END IF;
END $$;
-- ============================================================
