import { Test } from '@nestjs/testing';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

describe('AuditController', () => {
  let controller: AuditController;
  let service: AuditService;

  const mockService = {
    getBondTimeline: jest.fn(),
    getBondTraceability: jest.fn(),
    searchBonds: jest.fn(),
    getRecentEvents: jest.fn(),
  };

  // AuthGuard mock — always pass
  const mockAuthGuard = { canActivate: jest.fn(() => true) };

  beforeEach(async () => {
    jest.clearAllMocks();

    const mod = await Test.createTestingModule({
      controllers: [AuditController],
      providers: [
        { provide: AuditService, useValue: mockService },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = mod.get(AuditController);
    service = mod.get(AuditService);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Route registration
  // ─────────────────────────────────────────────────────────────────────────

  describe('route: GET bonds/:tokenId/traceability', () => {
    it('calls service.getBondTraceability with tokenId', async () => {
      mockService.getBondTraceability.mockResolvedValue({ bond: {}, events: [], transfers: [], owners: [] });

      const result = await controller.getBondTraceability('abc-123', { profile: { role: 'tse' } });

      expect(mockService.getBondTraceability).toHaveBeenCalledWith('abc-123');
      expect(result).toEqual({ bond: {}, events: [], transfers: [], owners: [] });
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Auth guard — all authenticated roles can access
  // ─────────────────────────────────────────────────────────────────────────

  describe('auth: all authenticated roles can access traceability', () => {
    it.each(['tse', 'emisor', 'comprador', 'recomprador', 'validador', 'admin'])(
      'allows role %s', async (role) => {
        mockService.getBondTraceability.mockResolvedValue({ bond: {}, events: [], transfers: [], owners: [] });

        const result = await controller.getBondTraceability('abc-123', { profile: { role } });

        expect(result).toBeDefined();
        expect(mockService.getBondTraceability).toHaveBeenCalled();
      },
    );
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Existing /timeline endpoint still has TSE/admin restriction
  // ─────────────────────────────────────────────────────────────────────────

  describe('route: GET bonds/:tokenId/timeline (existing)', () => {
    it('still works when called', async () => {
      mockService.getBondTimeline.mockResolvedValue({ bond: {}, events: [], transfers: [] });

      const result = await controller.getBondTimeline('abc-123', { profile: { role: 'tse' } });

      expect(mockService.getBondTimeline).toHaveBeenCalledWith('abc-123');
      expect(result).toEqual({ bond: {}, events: [], transfers: [] });
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // AuthGuard is applied at controller level
  // ─────────────────────────────────────────────────────────────────────────

  it('has AuthGuard on the controller', () => {
    const guards = Reflect.getMetadata('__guards__', AuditController);
    expect(guards).toBeDefined();
    const guardTypes = guards.map((g: any) => g.name ?? g.toString());
    expect(guardTypes.some((n: string) => n.includes('AuthGuard'))).toBe(true);
  });
});
