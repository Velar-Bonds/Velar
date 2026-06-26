-- Add new audit event types for missing lifecycle events
-- These fill gaps in the TSE's immutable audit trail.

ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS 'party_created';
ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS 'wallet_provisioned';
ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS 'bond_published';
ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS 'counter_offer_sent';
