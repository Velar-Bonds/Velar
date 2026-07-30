import { ForbiddenException, INestApplication } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';

describe('AnalyticsController legacy-export (transfer-detail CSV with names)', () => {
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

  it('GET /api/analytics/legacy-export?format=csv devuelve CSV con nombre de archivo del dia', async () => {
    const csv = '\uFEFFbond_id,transfer_date,seller_name,buyer_name,amount_colones,party_name\r\nBONO-001,2026-06-10,Partido,Comprador,100000,PLN\r\n';
    exportTransfersCsv.mockResolvedValue(csv);
    const today = new Date().toISOString().slice(0, 10);

    const res = await request(app.getHttpServer()).get('/api/analytics/legacy-export?format=csv').expect(200);

    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.headers['content-disposition']).toContain(`filename="velar-transfers-${today}.csv"`);
    expect(res.text).toBe(csv);
    expect(exportTransfersCsv).toHaveBeenCalledWith('tse', 'csv');
  });

  it('propaga 403 cuando el servicio rechaza el rol', async () => {
    role = 'comprador';
    exportTransfersCsv.mockRejectedValue(new ForbiddenException('Solo TSE'));

    await request(app.getHttpServer()).get('/api/analytics/legacy-export?format=csv').expect(403);
    expect(exportTransfersCsv).toHaveBeenCalledWith('comprador', 'csv');
  });
});

describe('AnalyticsController export (snapshot-based CSV/PDF, issue #44)', () => {
  let app: INestApplication;
  const exportCsv = jest.fn();
  const exportPdf = jest.fn();

  beforeEach(async () => {
    exportCsv.mockReset();
    exportPdf.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [{ provide: AnalyticsService, useValue: { exportCsv, exportPdf } }],
    })
      .overrideGuard(AuthGuard)
      .useValue({
        canActivate: (ctx: any) => {
          ctx.switchToHttp().getRequest().user = { id: 'user-1', profile: { role: 'tse', party_id: null } };
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

  it('GET /api/analytics/export?format=csv delegates to exportCsv with the resolved role/party/query', async () => {
    exportCsv.mockResolvedValue('csv-content');
    await request(app.getHttpServer()).get('/api/analytics/export?format=csv&country=CR').expect(200);
    expect(exportCsv).toHaveBeenCalledWith('tse', null, expect.objectContaining({ country: 'CR' }));
  });

  it('GET /api/analytics/export?format=pdf delegates to exportPdf and sets a pdf content-type', async () => {
    exportPdf.mockResolvedValue(Buffer.from('%PDF-1.7 stub'));
    const res = await request(app.getHttpServer()).get('/api/analytics/export?format=pdf').expect(200);
    expect(res.headers['content-type']).toContain('application/pdf');
    expect(exportPdf).toHaveBeenCalled();
  });
});

describe('AnalyticsController alert-rules RBAC (@Roles TSE/admin only)', () => {
  let app: INestApplication;
  let role: string;
  const listAlertRules = jest.fn().mockResolvedValue([]);

  beforeEach(async () => {
    role = 'emisor';

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [{ provide: AnalyticsService, useValue: { listAlertRules } }, Reflector, RolesGuard],
    })
      // The real AuthGuard is neutralized here (controller-scoped phase); the
      // fake global guard below sets req.user BEFORE RolesGuard runs, mirroring
      // production's actual global guard order (AuthGuard, then RolesGuard —
      // see app.module.ts's APP_GUARD registration).
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = module.createNestApplication();
    const fakeAuthGuard = {
      canActivate: (ctx: any) => {
        ctx.switchToHttp().getRequest().user = { profile: { role } };
        return true;
      },
    };
    app.useGlobalGuards(fakeAuthGuard, module.get(RolesGuard));
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('blocks a non-privileged role (emisor) from GET /api/analytics/alert-rules', async () => {
    await request(app.getHttpServer()).get('/api/analytics/alert-rules').expect(403);
  });

  it('allows tse through to GET /api/analytics/alert-rules', async () => {
    role = 'tse';
    await request(app.getHttpServer()).get('/api/analytics/alert-rules').expect(200);
  });
});
