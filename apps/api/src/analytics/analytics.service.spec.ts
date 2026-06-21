import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { SupabaseService } from '../common/supabase/supabase.service';

describe('AnalyticsService exportTransfersCsv', () => {
  let service: AnalyticsService;
  let fromMock: jest.Mock;

  beforeEach(async () => {
    fromMock = jest.fn();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: SupabaseService,
          useValue: {
            admin: { from: fromMock },
          },
        },
      ],
    }).compile();

    service = module.get(AnalyticsService);
  });

  it('rechaza roles distintos de TSE', async () => {
    await expect(service.exportTransfersCsv('comprador', 'csv')).rejects.toThrow(ForbiddenException);
    await expect(service.exportTransfersCsv('admin', 'csv')).rejects.toThrow(ForbiddenException);
  });

  it('rechaza formatos distintos de csv', async () => {
    await expect(service.exportTransfersCsv('tse', 'pdf')).rejects.toThrow(BadRequestException);
  });

  it('genera CSV con columnas requeridas y solo transferencias liberadas', async () => {
    const order = jest.fn().mockResolvedValue({
      data: [
        {
          amount: 150000,
          created_at: '2026-06-10T15:30:00.000Z',
          from_profile: { full_name: 'Partido ABC' },
          to_profile: { full_name: 'Juan Pérez' },
          bonds: { bond_id: 'BONO-001', parties: { name: 'Partido XYZ' } },
        },
        {
          amount: 200000,
          created_at: '2026-06-11T09:00:00.000Z',
          from_profile: { full_name: 'María, "La Vendedora"' },
          to_profile: { full_name: 'Carlos López' },
          bonds: { bond_id: 'BONO-002', parties: { name: 'Partido XYZ' } },
        },
      ],
      error: null,
    });
    const eq = jest.fn().mockReturnValue({ order });
    fromMock.mockReturnValue({ select: jest.fn().mockReturnValue({ eq }) });

    const csv = await service.exportTransfersCsv('tse', 'csv');

    expect(eq).toHaveBeenCalledWith('status', 'liberada');
    expect(csv.startsWith('\uFEFFbond_id,transfer_date,seller_name,buyer_name,amount_colones,party_name')).toBe(true);
    expect(csv).toContain('BONO-001,2026-06-10,Partido ABC,Juan Pérez,150000,Partido XYZ');
    expect(csv).toContain('"María, ""La Vendedora""",Carlos López,200000,Partido XYZ');
  });
});
