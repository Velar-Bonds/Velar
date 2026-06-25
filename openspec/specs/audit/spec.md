# Audit Traceability — Specification

## Purpose

Consolidate bond traceability data (bond info, audit events, transfers, and the chronological ownership chain) into a single canonical `GET /audit/bonds/:tokenId/traceability` endpoint. Replaces the ad-hoc client-side pattern of two parallel fetches plus manual derivation with a server-side, tested, and role-agnostic response.

## Requirements

### Requirement: Traceability endpoint

The system **MUST** expose `GET /audit/bonds/:tokenId/traceability` returning a `TraceabilityResponse` with `bond`, `events`, `transfers`, and `owners`.

#### Scenario: Happy path — bond with transfers returns full chain

- GIVEN a bond with `tokenId` `abc-123` exists and has 3 transfers in chronological order
- WHEN a GET request is sent to `/audit/bonds/abc-123/traceability`
- THEN the response status is `200`
- AND `response.bond.tokenId` equals `abc-123`
- AND `response.transfers` is an array of 3 items sorted by `createdAt` ascending
- AND `response.events` includes audit events for this bond
- AND `response.owners` is an array of 4 entries (1 issuer seed + 3 transfer recipients)
- AND the last `owners` entry has `current: true`

#### Scenario: Bond with no transfers — issuer is sole owner

- GIVEN a bond exists with no transfer records
- WHEN the endpoint is called with its `tokenId`
- THEN `response.owners` has exactly 1 entry
- AND that entry has `ownerId` matching the bond's `issuerPartyId`, `since` equal to `bond.createdAt`, `until: null`, `paid: false`, `current: true`

### Requirement: Ownership chain derivation

The system **MUST** derive the `owners[]` array by starting with the issuer party as seed owner, then scanning transfers chronologically by `createdAt ASC`, tracking `from_owner` → `to_owner` progression.

| Field | Value |
|-------|-------|
| `ownerId` | Profile ID of the party at that position |
| `name` | Resolved from the party's `profiles.fullName` (issuer) or transfer's joined profile data |
| `since` | `bond.createdAt` for issuer seed; transfer's `createdAt` for subsequent owners |
| `until` | Next transfer's `createdAt`, or `null` if this is the current owner |
| `paid` | `true` only if a transfer with status `liberada` exists for this owner as `to_owner` |
| `current` | `true` only for the last entry in the chronologically derived chain |

#### Scenario: Paid flag is true only for liberada transfers

- GIVEN a bond with two transfers: first completed (`liberada`), second pending (`solicitada`)
- WHEN the endpoint is called
- THEN the second owner (from first transfer's `to_owner`) has `paid: true`
- AND the third owner (from second transfer's `to_owner`) has `paid: false`

#### Scenario: Ownership chain matches bond.current_owner

- GIVEN a bond with transfers that ended with profile ID `user-456` as last `to_owner`
- WHEN the endpoint is called
- THEN the last `owners` entry's `ownerId` equals `user-456`
- AND this `owners` entry has `current: true`

### Requirement: Auth — all authenticated roles

The endpoint **MUST** be guarded by `@UseGuards(AuthGuard)` and accessible to all authenticated roles (tse, emisor, comprador, recomprador, validador, admin). The per-role `ForbiddenException` check **MUST NOT** be applied.

#### Scenario: Authenticated role accesses endpoint

- GIVEN the caller has any authenticated role (e.g., `comprador`)
- WHEN a GET request is sent to `/audit/bonds/:tokenId/traceability`
- THEN the response status is `200`

#### Scenario: Unauthenticated request returns 401

- GIVEN the caller has no auth token
- WHEN a GET request is sent to `/audit/bonds/:tokenId/traceability`
- THEN the response status is `401`

### Requirement: 404 for unknown bond

The system **MUST** return `NotFoundException` with `{ error: "Bond not found", statusCode: 404 }` when `tokenId` does not match any bond.

#### Scenario: Non-existent tokenId

- GIVEN no bond with `tokenId` `nonexistent-id` exists
- WHEN a GET request is sent to `/audit/bonds/nonexistent-id/traceability`
- THEN the response status is `404`
- AND `response.error` contains "Bond not found"

### Requirement: Backwards compatibility

The existing endpoints `GET /bonds`, `GET /transfers`, `GET /audit/bonds/:tokenId/timeline`, and `GET /audit/events` **MUST** continue to function unchanged.

#### Scenario: Existing /timeline endpoint still works

- GIVEN a valid bond with `tokenId` `abc-123`
- WHEN a GET request is sent to `/audit/bonds/abc-123/timeline`
- THEN the response status is `200`
- AND the response shape matches the existing `BondTimeline` interface

### Requirement: Party creation audit event

The system **MUST** emit a `party_created` audit event when a new party is created via `PartiesService.create()`.

- Payload: `{ code, name, stellarWallet }`
- Excluded: `bondTokenId`, `transferId`, `txHash` — not applicable at party creation

#### Scenario: Party creation emits audit event

- GIVEN a valid party creation request with `code`, `name`, and `stellarWallet`
- WHEN `PartiesService.create()` succeeds
- THEN an audit event of type `party_created` is persisted to `audit_events`
- AND the event payload contains `code`, `name`, and `stellarWallet`
- AND `bondTokenId`, `transferId`, and `txHash` are `null`

### Requirement: Wallet provisioning audit event

The system **MUST** emit a `wallet_provisioned` audit event when a wallet record is created via `WalletService.createWalletRecord()`.

- Payload: `{ label, publicKey, status, network }`
- Excluded: `bondTokenId`, `transferId` — not wallet concepts

#### Scenario: Wallet provisioning emits audit event

- GIVEN a wallet provisioning request with `label`, `publicKey`, `status`, and `network`
- WHEN `WalletService.createWalletRecord()` succeeds
- THEN an audit event of type `wallet_provisioned` is persisted to `audit_events`
- AND the event payload contains `label`, `publicKey`, `status`, and `network`
- AND `bondTokenId` and `transferId` are `null`

### Requirement: Bond publishing audit event

The system **MUST** emit a `bond_published` audit event when a bond's status transitions to published via `BondsService.publish()`.

- Payload: `{ previousStatus }`
- Includes: `bondTokenId`
- Excluded: `transferId` — no transfer involved

#### Scenario: Bond publish emits audit event

- GIVEN a bond in a non-published status
- WHEN `BondsService.publish(tokenId, actorId)` succeeds
- THEN an audit event of type `bond_published` is persisted to `audit_events`
- AND the event includes `bondTokenId`
- AND the event payload contains `previousStatus` reflecting the bond's status before publish
- AND `transferId` is `null`

### Requirement: Counter-offer audit event

The system **MUST** emit a `counter_offer_sent` audit event when a counter-offer is submitted via `TransfersService.counterOffer()`.

This replaces the previously incorrect `TRANSFER_ACEPTADA` emission — a counter-offer is not an acceptance.

- Payload: `{ counterOfferAmount, message }`
- Includes: `bondTokenId`, `transferId`

#### Scenario: Counter-offer emits correct event type

- GIVEN an existing transfer with a pending or active state
- WHEN `TransfersService.counterOffer()` succeeds
- THEN an audit event of type `counter_offer_sent` is persisted to `audit_events`
- AND the event includes `bondTokenId` and `transferId`
- AND the event payload contains `counterOfferAmount` and `message`
- AND the event type is NOT `TRANSFER_ACEPTADA`

## Data Contracts

### TraceabilityResponse

```typescript
// New — packages/types/src/audit.ts

interface OwnerEntry {
  ownerId: string;
  name: string;
  since: string;       // ISO-8601 timestamp
  until: string | null; // ISO-8601 timestamp or null (current owner)
  paid: boolean;
  current: boolean;
}

interface TraceabilityResponse {
  bond: BondToken;
  events: AuditEvent[];
  transfers: Transfer[];
  owners: OwnerEntry[];
}
```

### HTTP Responses

| Status | Body | When |
|--------|------|------|
| `200` | `TraceabilityResponse` | Bond exists |
| `401` | `{ error: string, statusCode: 401 }` | No/invalid auth |
| `404` | `{ error: "Bond not found", statusCode: 404 }` | Unknown `tokenId` |

## Future Considerations

- **Sidebar bond list optimization**: The frontend currently calls `/bonds?page=1&limit=100` separately for the sidebar list. A future optimization could cache the bond list in memory or expose a lightweight `/bonds/summary` endpoint for sidebar-only data. This is explicitly out of scope for this change.
