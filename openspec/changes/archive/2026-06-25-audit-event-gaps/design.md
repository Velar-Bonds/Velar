# Design: Audit Event Gaps

## Technical Approach

Close the audit trail gaps by extending the shared audit enum, extending the Postgres enum with a new migration, and adding `AuditService.emit()` calls directly inside the existing success paths that already own the business transition. The change is additive except for one semantic bug fix in `TransfersService.counterOffer()`, which must emit `counter_offer_sent` instead of `transfer_aceptada`.

## Architecture Decisions

### Decision: Emit at the existing domain success point

| Option | Tradeoff |
|--------|----------|
| **Emit inside `create()`, `createWalletRecord()`, `publish()`, `counterOffer()`** | Follows current service-owned pattern; keeps payload close to the data just written. |
| Add audit wrapper/helper methods | More abstraction, but violates the confirmed constraint and spreads responsibility. |

**Choice**: Emit inline with `AuditService.emit()` only.

### Decision: Party creation carries actor context; wallet provisioning may not

| Option | Tradeoff |
|--------|----------|
| **Thread `@CurrentUser().id` through `PartiesController.create()` → `PartiesService.create()`** | Preserves actor attribution for a user-driven action; requires one small controller signature change. |
| Leave `actorId` null everywhere | Smaller diff, but loses useful attribution where the caller already has auth context. |

**Choice**: Pass actorId for party creation; keep wallet provisioning actorless because `createWalletRecord()` is reused by auth, users, bonds, and parties as an internal infrastructure step.

### Decision: Use a new enum migration only

| Option | Tradeoff |
|--------|----------|
| **New `ALTER TYPE ... ADD VALUE IF NOT EXISTS` migration** | Safe, append-only, matches repo convention. |
| Edit prior migration/schema docs only | Breaks migration history; forbidden in this repo. |

**Choice**: New migration, no backfill.

## Data Flow

```text
HTTP action succeeds
  → service writes/updates Supabase row
  → same service calls AuditService.emit({...})
  → AuditService inserts append-only row into audit_events

PartiesController.create(user)
  → PartiesService.create(body, actorId)
  → insert parties
  → emit PARTY_CREATED

WalletService.createWalletRecord(label)
  → persist custody wallet
  → emit WALLET_PROVISIONED
```

`BondsService.publish()` emits after the status update to `en_venta` using the previous bond status in payload. `TransfersService.counterOffer()` keeps the same payload and identifiers, changing only the event type to `counter_offer_sent`.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `packages/types/src/audit.ts` | Modify | Add `PARTY_CREATED`, `WALLET_PROVISIONED`, `BOND_PUBLISHED`, `COUNTER_OFFER_SENT`. |
| `supabase/migrations/<timestamp>_audit_event_gaps.sql` | Create | Add the four enum values with `ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS`. |
| `apps/api/src/parties/parties.controller.ts` | Modify | Pass `@CurrentUser() user` into `create()` so the audit event keeps actor attribution. |
| `apps/api/src/parties/parties.service.ts` | Modify | Inject `AuditService`; emit `PARTY_CREATED` with `{ code, name, stellarWallet }`. |
| `apps/api/src/parties/parties.module.ts` | Modify | Import `AuditModule`. |
| `apps/api/src/escrow/wallet.service.ts` | Modify | Inject `AuditService`; emit `WALLET_PROVISIONED` with `{ label, publicKey, status, network }`. |
| `apps/api/src/escrow/escrow.module.ts` | Modify | Import `AuditModule` so `WalletService` can inject `AuditService`. |
| `apps/api/src/bonds/bonds.service.ts` | Modify | Emit `BOND_PUBLISHED` after publish succeeds with `bondTokenId` and `{ previousStatus }`. |
| `apps/api/src/transfers/transfers.service.ts` | Modify | Replace `TRANSFER_ACEPTADA` with `COUNTER_OFFER_SENT` in `counterOffer()`. |
| `apps/api/test/bonds-flow.e2e-spec.ts` | Modify | Extend mocked-flow coverage for publish and counter-offer emission assertions. |
| `docs/WEB3.md` | Modify | Refresh §8 to reflect the real `audit_events` shape and complete event catalog. |

## Interfaces / Contracts

```ts
export const AuditEventType = {
  PARTY_CREATED: 'party_created',
  WALLET_PROVISIONED: 'wallet_provisioned',
  BOND_PUBLISHED: 'bond_published',
  COUNTER_OFFER_SENT: 'counter_offer_sent',
} as const;
```

- Postgres contract: `audit_event_type` enum gains the same 4 values.
- Service contract change: `PartiesService.create(body, actorId?: string)` to preserve actor attribution.
- Event payload contracts follow the delta spec exactly; no API response shapes change.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| API integration (Jest) | `publish()` emits `BOND_PUBLISHED` with previous status; `counterOffer()` emits `COUNTER_OFFER_SENT` | Extend `apps/api/test/bonds-flow.e2e-spec.ts` using the existing mocked `AuditService.emit`. |
| API integration (Jest) | Party creation and wallet provisioning emit expected payloads | Add focused service tests or extend the same mocked pattern with `PartiesService`/`WalletService` providers. |
| Build/type safety | Shared enum additions compile across workspaces | Run `npm run build`. |
| Migration validation | SQL applies cleanly and is idempotent for existing environments | Validate with Supabase migration dry-run / local apply. |

## Migration / Rollout

Apply the new migration before deploying API code that emits the new values; otherwise inserts into `audit_events.type` will fail. No backfill is required. Rollback is code-first: stop emitting the new values and revert docs/types; the enum values remain in Postgres because enum removal is not a safe rollback path.

## Open Questions

None.
