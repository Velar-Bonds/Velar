import { ForbiddenException, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AuthGuard } from '../auth/auth.guard';

describe('AnalyticsController export', () => {
  let app: INestApplication;
  let role: string;
  const exportTransfersCsv = jest.fn();

  beforeEach(async () => {
    role = 'tse';
    exportTransfersCsv.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [{ provide: AnalyticsService, useValue: { exportTransfersCsv } }],
    })
      .overrideGuard(AuthGuard)
      .useValue({
        canActivate: (ctx: { switchToHttp: () => { getRequest: () => { user: { profile: { role: string } } } } }) => {
          ctx.switchToHttp().getRequest().user = { profile: { role } };
          return true;
        },
      })
      .compile();

    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /api/analytics/export?format=csv devuelve CSV con nombre de archivo del dia', async () => {
    const csv = '\uFEFFbond_id,transfer_date,seller_name,buyer_name,amount_colones,party_name\r\nBONO-001,2026-06-10,Partido,Comprador,100000,PLN\r\n';
    exportTransfersCsv.mockResolvedValue(csv);
    const today = new Date().toISOString().slice(0, 10);

    const res = await request(app.getHttpServer()).get('/api/analytics/export?format=csv').expect(200);

    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.headers['content-disposition']).toContain(`filename="velar-transfers-${today}.csv"`);
    expect(res.text).toBe(csv);
    expect(exportTransfersCsv).toHaveBeenCalledWith('tse', 'csv');
  });

  it('propaga 403 cuando el servicio rechaza el rol', async () => {
    role = 'comprador';
    exportTransfersCsv.mockRejectedValue(new ForbiddenException('Solo TSE'));

    await request(app.getHttpServer()).get('/api/analytics/export?format=csv').expect(403);
    expect(exportTransfersCsv).toHaveBeenCalledWith('comprador', 'csv');
  });
});
