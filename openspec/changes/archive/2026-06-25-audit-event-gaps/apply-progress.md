# Apply Progress: audit-event-gaps

**Change**: `audit-event-gaps`  
**PR Slice**: Single PR  
**Mode**: Strict TDD  
**Chain strategy**: `pending`

## Scope

This batch implements the full change:

- shared audit event constants in `packages/types/src/audit.ts`
- enum migration in `supabase/migrations/20260624000001_audit_event_gaps.sql`
- party creation audit emission
- wallet provisioning audit emission
- bond publish audit emission
- counter-offer event type correction
- focused backend tests and docs update

## Completed Tasks

- [x] 1.1 Update `packages/types/src/audit.ts` with `PARTY_CREATED`, `WALLET_PROVISIONED`, `BOND_PUBLISHED`, and `COUNTER_OFFER_SENT`.
- [x] 1.2 Add `supabase/migrations/20260624000001_audit_event_gaps.sql` with `ALTER TYPE ... ADD VALUE IF NOT EXISTS` for the 4 new values.
- [x] 1.3 Wire audit dependencies in `apps/api/src/parties/parties.module.ts` and `apps/api/src/escrow/escrow.module.ts`.
- [x] 2.1 Update `apps/api/src/parties/parties.controller.ts` and `apps/api/src/parties/parties.service.ts` to emit `PARTY_CREATED`.
- [x] 2.2 Update `apps/api/src/escrow/wallet.service.ts` to emit `WALLET_PROVISIONED` from `createWalletRecord()`.
- [x] 2.3 Update `apps/api/src/bonds/bonds.service.ts` `publish()` to emit `BOND_PUBLISHED`.
- [x] 2.4 Update `apps/api/src/transfers/transfers.service.ts` `counterOffer()` to emit `COUNTER_OFFER_SENT`.
- [x] 3.1 Add runtime coverage for `BOND_PUBLISHED` and `COUNTER_OFFER_SENT` under the default API Jest runner.
- [x] 3.2 Add `apps/api/src/parties/parties.service.spec.ts` for `PARTY_CREATED` success and fallback paths.
- [x] 3.3 Add `apps/api/src/escrow/wallet.service.spec.ts` for `WALLET_PROVISIONED` funded and failed paths.
- [x] 3.4 Verify `npm run test --workspace apps/api`, `npm run build --workspace packages/types`, and `npm run build --workspace apps/api` pass.
- [x] 4.1 Update `docs/WEB3.md` section 8 with the current audit schema and event catalog.

## TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 1.1 | `apps/api/src/bonds/bonds.service.spec.ts` | Unit | N/A (shared constants) | ✅ Focused coverage added before final verify | ✅ Passing | ✅ Publish scenario asserted | ➖ None needed |
| 1.2 | N/A (migration) | — | N/A (new) | ➖ SQL change | ✅ Build/test suite unaffected | ➖ Manual migration artifact only | ➖ None needed |
| 2.1 | `apps/api/src/parties/parties.service.spec.ts` | Unit | N/A (new) | ✅ Spec written for success + fallback | ✅ 2/2 passing | ✅ Multiple scenarios | ✅ Fallback path preserved |
| 2.2 | `apps/api/src/escrow/wallet.service.spec.ts` | Unit | N/A (new) | ✅ Spec written for funded + failed paths | ✅ 2/2 passing | ✅ Multiple scenarios | ➖ None needed |
| 2.3 | `apps/api/src/bonds/bonds.service.spec.ts` | Unit | N/A (new) | ✅ Publish regression test added | ✅ 1/1 passing | ➖ Single scenario in spec | ➖ None needed |
| 2.4 | `apps/api/src/transfers/transfers.service.spec.ts` | Unit | N/A (new) | ✅ Counter-offer regression test added | ✅ 1/1 passing | ➖ Single scenario in spec | ➖ None needed |
| 3.1 | `apps/api/src/bonds/bonds.service.spec.ts`, `apps/api/src/transfers/transfers.service.spec.ts` | Unit | ✅ Existing test suite still green | ✅ Tests exist in default runner | ✅ Passing in workspace runner | ✅ Covers required event behavior | ✅ Removed verify gap |
| 3.2 | `apps/api/src/parties/parties.service.spec.ts` | Unit | N/A (new) | ✅ Written | ✅ Passing | ✅ 2 scenarios | ➖ None needed |
| 3.3 | `apps/api/src/escrow/wallet.service.spec.ts` | Unit | N/A (new) | ✅ Written | ✅ Passing | ✅ 2 scenarios | ➖ None needed |
| 3.4 | N/A (verification task) | — | ✅ Existing suites rerun | ➖ No new tests | ✅ Commands pass | ➖ N/A | ✅ Final cleanup done |
| 4.1 | N/A (docs) | — | ✅ Existing suites rerun | ➖ No new tests | ✅ Docs aligned with code | ➖ N/A | ✅ Schema docs corrected |

## Test Results

### API Jest

```text
PASS src/bonds/bonds.service.spec.ts
PASS src/transfers/transfers.service.spec.ts
PASS src/parties/parties.service.spec.ts
PASS src/escrow/wallet.service.spec.ts
PASS src/common/pagination.spec.ts
PASS src/app.controller.spec.ts
PASS src/analytics/analytics.service.spec.ts
PASS src/analytics/analytics.controller.spec.ts

Tests: 16 passed, 16 total
Suites: 8 passed, 8 total
```

### Builds

```text
npm run build --workspace packages/types  -> PASS
npm run build --workspace apps/api       -> PASS
```

## Files Changed

| File | Action | What Was Done |
|------|--------|---------------|
| `packages/types/src/audit.ts` | Modified | Added 4 new audit constants |
| `supabase/migrations/20260624000001_audit_event_gaps.sql` | Created | Added append-only enum migration |
| `apps/api/src/parties/parties.controller.ts` | Modified | Passed actor id into create flow |
| `apps/api/src/parties/parties.service.ts` | Modified | Emitted `PARTY_CREATED` on success and fallback paths |
| `apps/api/src/parties/parties.module.ts` | Modified | Imported `AuditModule` |
| `apps/api/src/escrow/wallet.service.ts` | Modified | Emitted `WALLET_PROVISIONED` and awaited audit write |
| `apps/api/src/escrow/escrow.module.ts` | Modified | Imported `AuditModule` |
| `apps/api/src/bonds/bonds.service.ts` | Modified | Emitted `BOND_PUBLISHED` with previous status |
| `apps/api/src/transfers/transfers.service.ts` | Modified | Replaced wrong event type with `COUNTER_OFFER_SENT` |
| `apps/api/src/bonds/bonds.service.spec.ts` | Created | Added publish emission runtime proof |
| `apps/api/src/transfers/transfers.service.spec.ts` | Created | Added counter-offer emission runtime proof |
| `apps/api/src/parties/parties.service.spec.ts` | Created | Added party emission tests |
| `apps/api/src/escrow/wallet.service.spec.ts` | Created | Added wallet emission tests |
| `apps/api/test/bonds-flow.e2e-spec.ts` | Modified | Updated helper providers so the suite matches current constructors |
| `docs/WEB3.md` | Modified | Corrected schema and event catalog |

## Deviations from Design

None — implementation remains inside the existing `AuditService.emit()` pattern and uses only additive enum + migration changes.

## Status

12/12 tasks complete. Ready for verify.
