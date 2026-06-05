-- VELAR: guarda el contrato Soroban de cada bono.
-- Cuando se aprueba una solicitud, además de emitir el Classic Asset (compatibilidad),
-- se despliega un contrato VelarBond en Soroban con TODA la metadata on-chain.
-- Postgres queda como cache + índice; el contrato es la fuente de verdad inmutable.

ALTER TABLE bonds
  ADD COLUMN IF NOT EXISTS soroban_contract_id   text,
  ADD COLUMN IF NOT EXISTS soroban_init_tx_hash  text,
  ADD COLUMN IF NOT EXISTS soroban_deployed_at   timestamptz,
  ADD COLUMN IF NOT EXISTS soroban_error         text;

CREATE INDEX IF NOT EXISTS idx_bonds_soroban_contract ON bonds(soroban_contract_id) WHERE soroban_contract_id IS NOT NULL;
