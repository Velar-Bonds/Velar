-- VELAR - Stellar wallet metadata, on-chain bond registry fields, and negotiation states.

ALTER TYPE bond_status ADD VALUE IF NOT EXISTS 'en_venta';

ALTER TYPE transfer_status ADD VALUE IF NOT EXISTS 'contraoferta';

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stellar_wallet_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS stellar_network       text NOT NULL DEFAULT 'testnet',
  ADD COLUMN IF NOT EXISTS stellar_created_at    timestamptz,
  ADD COLUMN IF NOT EXISTS stellar_wallet_error  text;

ALTER TABLE parties
  ADD COLUMN IF NOT EXISTS stellar_wallet        text,
  ADD COLUMN IF NOT EXISTS stellar_wallet_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS stellar_network       text NOT NULL DEFAULT 'testnet',
  ADD COLUMN IF NOT EXISTS stellar_created_at    timestamptz,
  ADD COLUMN IF NOT EXISTS stellar_wallet_error  text;

ALTER TABLE bonds
  ADD COLUMN IF NOT EXISTS stellar_status            text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS stellar_transaction_hash  text,
  ADD COLUMN IF NOT EXISTS stellar_ledger            bigint,
  ADD COLUMN IF NOT EXISTS stellar_asset_code        text,
  ADD COLUMN IF NOT EXISTS stellar_issuer_public_key text,
  ADD COLUMN IF NOT EXISTS stellar_owner_public_key  text,
  ADD COLUMN IF NOT EXISTS stellar_registered_at     timestamptz,
  ADD COLUMN IF NOT EXISTS stellar_error             text;

ALTER TABLE transfers
  ADD COLUMN IF NOT EXISTS counter_offer_amount numeric,
  ADD COLUMN IF NOT EXISTS seller_message       text,
  ADD COLUMN IF NOT EXISTS buyer_message        text;

CREATE INDEX IF NOT EXISTS idx_bonds_stellar_status ON bonds(stellar_status);
