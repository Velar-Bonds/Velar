-- Permite al dueño pedir al TSE que retire el bono del escrow cuando no hay acuerdo.
-- Flujo: dueño pide → TSE aprueba → token vuelve on-chain al dueño y transfer queda CANCELADA.

ALTER TABLE transfers
  ADD COLUMN IF NOT EXISTS return_requested_at  timestamptz,
  ADD COLUMN IF NOT EXISTS return_requested_by  uuid REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS return_reason        text,
  ADD COLUMN IF NOT EXISTS return_approved_at   timestamptz,
  ADD COLUMN IF NOT EXISTS return_approved_by   uuid REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS return_rejected_at   timestamptz,
  ADD COLUMN IF NOT EXISTS return_rejected_by   uuid REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS return_tse_notes     text;

CREATE INDEX IF NOT EXISTS idx_transfers_return_pending
  ON transfers(return_requested_at)
  WHERE return_requested_at IS NOT NULL AND return_approved_at IS NULL AND return_rejected_at IS NULL;
