-- Add indexes to speed up audit_events timeline and explorer queries ordered by date.
CREATE INDEX IF NOT EXISTS idx_audit_created
  ON audit_events (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_bond_created
  ON audit_events (bond_token_id, created_at DESC);
