-- ============================================================
-- VELAR — Método de pago elegido en una negociación (transfer)
-- ============================================================
-- Al solicitar compra, el comprador indica cómo pagará si el vendedor acepta:
--   sinpe | transferencia → flujo P2P off-chain (evidencia + release)
--   wallet              → DvP atómico USDC on-chain tras aceptación
--
-- Rollback: ALTER TABLE transfers DROP COLUMN IF EXISTS payment_method;
-- ============================================================

ALTER TABLE transfers
  ADD COLUMN IF NOT EXISTS payment_method text;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transfers_payment_method_chk') THEN
    ALTER TABLE transfers
      ADD CONSTRAINT transfers_payment_method_chk
      CHECK (payment_method IS NULL OR payment_method IN ('sinpe','transferencia','wallet'));
  END IF;
END $$;
