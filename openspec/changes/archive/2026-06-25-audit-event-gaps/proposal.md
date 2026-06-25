# Proposal: audit-event-gaps

## Intent

Four critical actions in the platform (party creation, wallet provisioning, bond publishing, and counter-offer sending) do not emit audit events, creating blind spots in the TSE's immutable audit trail. One existing emission (`counterOffer()` emits `TRANSFER_ACEPTADA`) is semantically wrong. Close these gaps.

## Scope

### In Scope
- Add `party_created` emission in `PartiesService.create()`
- Add `wallet_provisioned` emission in `WalletService.createWalletRecord()`
- Add `bond_published` emission in `BondsService.publish()`
- Fix `counterOffer()` bug: replace `TRANSFER_ACEPTADA` with `counter_offer_sent`
- Add 4 new enum values to `AuditEventType` in `@velar/types`
- Create Supabase migration with `ALTER TYPE audit_event_type ADD VALUE` for each new type
- Update `docs/WEB3.md` §8 (audit table schema and event list)

### Out of Scope
- **offer_rejected**: not needed — `TRANSFER_RECHAZADA` already covers this case
- Backfill of existing records (new events only)
- New audit controller endpoints or query changes
- Notification integration for the new events
- Changes to `BondsService` emit points beyond `publish()` (e.g., `create()`)

## Capabilities

> No spec-level behavior changes — this is pure instrumentation and a bug fix.

### New Capabilities
None

### Modified Capabilities
None

## Approach

1. **Types**: Add `PARTY_CREATED`, `WALLET_PROVISIONED`, `BOND_PUBLISHED`, `COUNTER_OFFER_SENT` to `AuditEventType` in `packages/types/src/audit.ts`
2. **Migration**: New file `supabase/migrations/` with `ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS` for all 4 new types
3. **Emissions**: Add `this.audit.emit({...})` calls at the relevant return points, following the existing pattern
4. **Bug fix**: In `TransfersService.counterOffer()`, swap `AuditEventType.TRANSFER_ACEPTADA` for `AuditEventType.COUNTER_OFFER_SENT`
5. **Docs**: Update `docs/WEB3.md` §8 with current table schema and complete event list

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `packages/types/src/audit.ts` | Modified | Add 4 new enum constants |
| `packages/types/src/index.ts` | Modified | Re-export if needed |
| `supabase/migrations/*.sql` | New | ALTER TYPE migration |
| `apps/api/src/parties/parties.service.ts` | Modified | Add `party_created` emission |
| `apps/api/src/escrow/wallet.service.ts` | Modified | Add `wallet_provisioned` emission |
| `apps/api/src/bonds/bonds.service.ts` | Modified | Add `bond_published` emission |
| `apps/api/src/transfers/transfers.service.ts` | Modified | Fix `counterOffer()` event type |
| `docs/WEB3.md` | Modified | Update audit section |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Migration fails if enum values already exist | Low | Use `IF NOT EXISTS` |
| Missing actor/transfer context in emit() | Low | Follow existing pattern; payloads are optional |
| `counterOffer()` bug fix changes behavior for consumers | Low | Only the event type changes; no consumer currently reads `TRANSFER_ACEPTADA` from this call path |

## Rollback Plan

1. Revert `@velar/types` changes
2. Revert service files
3. Revert migration — Postgres does not support removing enum values; if needed, create a new migration that stops using the values or drop/recreate the enum (requires downtime and cascade)

## Dependencies

- None

## Success Criteria

- [ ] `npm run build` passes across all workspaces
- [ ] `npm run test --workspace apps/api` passes
- [ ] New migration runs cleanly `Npx supabase migration up` (dry-run)
- [ ] Each new event type appears in `audit_events` after its corresponding action
- [ ] `counterOffer()` emits `counter_offer_sent` instead of `TRANSFER_ACEPTADA`
