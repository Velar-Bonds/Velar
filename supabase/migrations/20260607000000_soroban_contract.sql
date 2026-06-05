-- Soporte para bonos como contratos Soroban (cada bono = 1 contrato).
-- Los bonos viejos siguen como Classic Asset (compatibilidad).

ALTER TABLE bonds
  ADD COLUMN IF NOT EXISTS soroban_contract_id   text,
  ADD COLUMN IF NOT EXISTS soroban_init_tx_hash  text;

CREATE INDEX IF NOT EXISTS idx_bonds_soroban_contract ON bonds(soroban_contract_id);
