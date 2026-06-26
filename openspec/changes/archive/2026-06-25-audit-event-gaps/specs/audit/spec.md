# Delta for Audit

## ADDED Requirements

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
