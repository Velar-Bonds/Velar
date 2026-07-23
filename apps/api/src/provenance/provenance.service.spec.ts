import { provenanceFixture, provenanceFixtureIds } from '@velar/types';
import { AuditService } from '../audit/audit.service';
import { ProvenanceService } from './provenance.service';

describe('ProvenanceService', () => {
  const ids = provenanceFixtureIds;
  let audit: jest.Mocked<Pick<AuditService, 'getProvenanceInput' | 'resolveTokenId'>>;
  let service: ProvenanceService;

  beforeEach(() => {
    audit = {
      getProvenanceInput: jest.fn().mockResolvedValue(provenanceFixture),
      resolveTokenId: jest.fn().mockResolvedValue(ids.token),
    };
    service = new ProvenanceService(audit as unknown as AuditService);
  });

  it('reconstructs and verifies provenance for an authenticated caller', async () => {
    const result = await service.getBondProvenance(ids.token);
    expect(audit.getProvenanceInput).toHaveBeenCalledWith(ids.token);
    expect(result.integrity.ok).toBe(true);
    expect(result.ownership).toHaveLength(2);
    expect(result.transfers[0].status).toBe('liberada');
  });

  it('resolves a readable bond_id before reconstructing for public callers', async () => {
    const result = await service.getPublicBondProvenance('BOND-2026-001');
    expect(audit.resolveTokenId).toHaveBeenCalledWith('BOND-2026-001');
    expect(audit.getProvenanceInput).toHaveBeenCalledWith(ids.token);
    expect(result.bond.tokenId).toBe(ids.token);
  });

  it('surfaces integrity anomalies from the engine', async () => {
    audit.getProvenanceInput.mockResolvedValueOnce({
      ...provenanceFixture,
      bond: { ...provenanceFixture.bond, currentOwner: 'ghost-owner' },
    });
    const result = await service.getBondProvenance(ids.token);
    expect(result.integrity.ok).toBe(false);
    expect(result.integrity.anomalies.some((a) => a.type === 'onchain_offchain_mismatch')).toBe(true);
  });
});
