-- VELAR: almacenamiento para hash chain de audit_events (#41).
--
-- La cadena se calcula y verifica en código de aplicación
-- (`apps/api/src/audit/audit-chain.ts`), no en SQL, para poder testearla
-- con fakes en memoria sin DB en vivo. Esta migración solo aporta columnas
-- de almacenamiento.
--
-- chain_seq / prev_hash / hash son nullable: filas históricas anteriores a
-- la cadena permanecen NULL. Solo inserts posteriores (vía la capa de app)
-- populan estos campos.

-- bigint nullable (equivalente de ordenamiento a bigserial, sin backfill
-- NOT NULL de filas existentes).
ALTER TABLE audit_events ADD COLUMN IF NOT EXISTS chain_seq bigint;
ALTER TABLE audit_events ADD COLUMN IF NOT EXISTS prev_hash text;
ALTER TABLE audit_events ADD COLUMN IF NOT EXISTS hash text;

-- UNIQUE permite múltiples NULL (filas pre-cadena) e indexa chain_seq
-- para scans ordenados de verificación — no hace falta un idx_ adicional.
CREATE UNIQUE INDEX IF NOT EXISTS uq_audit_events_chain_seq
  ON audit_events(chain_seq);
