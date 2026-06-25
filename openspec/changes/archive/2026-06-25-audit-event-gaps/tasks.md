# Tasks: Audit Event Gaps

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 220-340 |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Types, migration, API emits, tests, docs | PR 1 | Single deliverable; keep tests and docs in the same diff |

## Phase 1: Foundation

- [x] 1.1 Update `packages/types/src/audit.ts` with `PARTY_CREATED`, `WALLET_PROVISIONED`, `BOND_PUBLISHED`, and `COUNTER_OFFER_SENT`; verify `packages/types/src/index.ts` needs no extra export change.
- [x] 1.2 Add `supabase/migrations/<timestamp>_audit_event_gaps.sql` extending `audit_event_type` with the 4 values via `ALTER TYPE ... ADD VALUE IF NOT EXISTS`; do not backfill rows.
- [x] 1.3 Wire audit dependencies for new emit points: import `AuditModule` in `apps/api/src/parties/parties.module.ts` and `apps/api/src/escrow/escrow.module.ts`.

## Phase 2: Core Implementation

- [x] 2.1 Update `apps/api/src/parties/parties.controller.ts` to pass `@CurrentUser() user` into `create()`, then change `apps/api/src/parties/parties.service.ts` to accept `actorId` and emit `AuditService.emit()` with `PARTY_CREATED` and `{ code, name, stellarWallet }`.
- [x] 2.2 Update `apps/api/src/escrow/wallet.service.ts` to inject `AuditService` and emit `WALLET_PROVISIONED` from `createWalletRecord()` with `{ label, publicKey, status, network }`; keep this event in `createWalletRecord()` only.
- [x] 2.3 Update `apps/api/src/bonds/bonds.service.ts` `publish()` to emit `BOND_PUBLISHED` after the status update, including `bondTokenId`, `actorId`, and payload `{ previousStatus }`.
- [x] 2.4 Update `apps/api/src/transfers/transfers.service.ts` `counterOffer()` to emit `COUNTER_OFFER_SENT` instead of `TRANSFER_ACEPTADA`; leave `rejectTransfer()` unchanged and do not add `offer_rejected`.

## Phase 3: Testing and Verification

- [x] 3.1 Extend `apps/api/test/bonds-flow.e2e-spec.ts` to assert `publish()` emits `BOND_PUBLISHED` with the previous status and `counterOffer()` emits `COUNTER_OFFER_SENT`, not `TRANSFER_ACEPTADA`.
- [x] 3.2 Add `apps/api/src/parties/parties.service.spec.ts` covering successful `create()` emission payload/actor attribution and fallback insert behavior when the richer row insert hits schema-cache errors.
- [x] 3.3 Add `apps/api/src/escrow/wallet.service.spec.ts` covering `createWalletRecord()` emission payload and emitted status when funding succeeds or fails.
- [x] 3.4 Verify `npm run test --workspace apps/api` and `npm run build` pass, and record migration validation with a local Supabase dry-run/apply before shipping API code.

## Phase 4: Documentation

- [x] 4.1 Update `docs/WEB3.md` section 8 to reflect the current `audit_events` shape and include the full event catalog with the new English event values.
