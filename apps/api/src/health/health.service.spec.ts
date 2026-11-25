import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus, INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import * as request from 'supertest';
import { AuthGuard } from '../auth/auth.guard';
import { ContractExceptionFilter } from '../common/contracts/contract-exception.filter';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { SupabaseService } from '../common/supabase/supabase.service';
import { WalletService } from '../escrow/wallet.service';

const PLATFORM_ADDRESS = 'GPLATFORM0000000000000000000000000000000000000000000';
const ESCROW_ADDRESS = 'GESCROW00000000000000000000000000000000000000000000';

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: async () => body,
  } as unknown as Response;
}

describe('HealthService', () => {
  let service: HealthService;
  let module: TestingModule;
  let selectMock: jest.Mock;
  let walletService: { platformAddress?: string; escrowAddress?: string };

  beforeEach(async () => {
    selectMock = jest.fn().mockResolvedValue({ error: null });
    const query = {
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      abortSignal: selectMock,
    };
    walletService = { platformAddress: PLATFORM_ADDRESS, escrowAddress: ESCROW_ADDRESS };

    module = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        HealthService,
        { provide: APP_GUARD, useClass: AuthGuard },
        {
          provide: SupabaseService,
          useValue: { admin: { from: jest.fn(() => query) } },
        },
        { provide: WalletService, useValue: walletService },
      ],
    }).compile();

    service = module.get(HealthService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  /** Simula: Horizon ok, Soroban RPC ok, wallets con balance saludable. */
  function mockHealthyFetch() {
    return jest.spyOn(globalThis, 'fetch').mockImplementation(async (input: unknown) => {
      const url = String(input);
      if (url.includes('soroban')) {
        return jsonResponse({ result: { status: 'healthy' } });
      }
      if (url.includes('/accounts/')) {
        return jsonResponse({ balances: [{ asset_type: 'native', balance: '100.0000000' }] });
      }
      return jsonResponse({});
    });
  }

  describe('liveness()', () => {
    it('responde ok sin llamar a fetch (sin dependencias externas)', () => {
      const fetchSpy = jest.spyOn(globalThis, 'fetch');
      const result = service.liveness();

      expect(result.status).toBe('ok');
      expect(typeof result.uptime).toBe('number');
      expect(result.version).toBeDefined();
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  describe('check() (readiness)', () => {
    it('devuelve status ok cuando todas las dependencias están sanas', async () => {
      mockHealthyFetch();

      const result = await service.check();

      expect(result.status).toBe('ok');
      expect(result.supabase).toBe('up');
      expect(result.stellar).toBe('up');
      expect(result.soroban).toBe('up');
      expect(result.wallets.platform.status).toBe('ok');
      expect(result.wallets.escrow.status).toBe('ok');
    });

    it('reporta degraded (200, no throw) cuando el balance de una wallet está bajo', async () => {
      jest.spyOn(globalThis, 'fetch').mockImplementation(async (input: unknown) => {
        const url = String(input);
        if (url.includes('soroban')) return jsonResponse({ result: { status: 'healthy' } });
        if (url.includes(PLATFORM_ADDRESS)) {
          return jsonResponse({ balances: [{ asset_type: 'native', balance: '0.5000000' }] });
        }
        if (url.includes('/accounts/')) {
          return jsonResponse({ balances: [{ asset_type: 'native', balance: '100.0000000' }] });
        }
        return jsonResponse({});
      });

      const result = await service.check();

      expect(result.status).toBe('degraded');
      expect(result.wallets.platform.status).toBe('degraded');
      expect(result.wallets.platform.balanceXlm).toBe(0.5);
    });

    it('marca wallets sin dirección configurada como unconfigured, sin bajar el servicio', async () => {
      walletService.platformAddress = undefined;
      walletService.escrowAddress = undefined;
      mockHealthyFetch();

      const result = await service.check();

      expect(result.status).toBe('ok');
      expect(result.wallets.platform.status).toBe('unconfigured');
      expect(result.wallets.escrow.status).toBe('unconfigured');
    });

    it('lanza 503 con el detalle en el body cuando Supabase está caído', async () => {
      expect.assertions(3);
      selectMock.mockResolvedValue({ error: new Error('db down') });
      mockHealthyFetch();

      try {
        await service.check();
      } catch (e) {
        expect((e as HttpException).getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
        const body = (e as HttpException).getResponse() as { status: string; supabase: string };
        expect(body.status).toBe('degraded');
        expect(body.supabase).toBe('down');
      }
    });

    it.each(['up', 'down'])('informa Horizon caído con Supabase %s', async (supabase) => {
      if (supabase === 'down') selectMock.mockResolvedValue({ error: new Error('db down') });
      mockHealthyFetch().mockResolvedValueOnce(jsonResponse({}, false, 503));

      await expect(service.check()).rejects.toMatchObject({
        status: HttpStatus.SERVICE_UNAVAILABLE,
        response: { status: 'degraded', supabase, stellar: 'down' },
      });
    });

    it('agota el timeout en paralelo e incluye la lectura del cuerpo de Soroban', async () => {
      jest.useFakeTimers();
      selectMock.mockReturnValue(new Promise(() => {}));
      const stalledBody = { ...jsonResponse({}), json: () => new Promise(() => {}) } as Response;
      const fetchMock = mockHealthyFetch()
        .mockResolvedValueOnce(jsonResponse({}))
        .mockResolvedValueOnce(stalledBody);

      const result = expect(service.check()).rejects.toMatchObject({
        status: HttpStatus.SERVICE_UNAVAILABLE,
        response: { status: 'degraded', supabase: 'down', stellar: 'up', soroban: 'down' },
      });
      await jest.advanceTimersByTimeAsync(3000);
      await result;
      expect(selectMock.mock.calls[0][0]).toHaveProperty('aborted', true);
      expect(fetchMock.mock.calls[1][1]?.signal?.aborted).toBe(true);
      expect(jest.getTimerCount()).toBe(0);
    }, 1000);

    it('lanza 503 cuando el RPC de Soroban está caído, aunque Horizon esté sano', async () => {
      jest.spyOn(globalThis, 'fetch').mockImplementation(async (input: unknown) => {
        const url = String(input);
        if (url.includes('soroban')) return jsonResponse({}, false, 500);
        if (url.includes('/accounts/')) {
          return jsonResponse({ balances: [{ asset_type: 'native', balance: '100.0000000' }] });
        }
        return jsonResponse({});
      });

      await expect(service.check()).rejects.toThrow(HttpException);
    });

    it('lanza 503 cuando una wallet configurada es inalcanzable (down)', async () => {
      jest.spyOn(globalThis, 'fetch').mockImplementation(async (input: unknown) => {
        const url = String(input);
        if (url.includes('soroban')) return jsonResponse({ result: { status: 'healthy' } });
        if (url.includes(ESCROW_ADDRESS)) return jsonResponse({}, false, 404);
        if (url.includes('/accounts/')) {
          return jsonResponse({ balances: [{ asset_type: 'native', balance: '100.0000000' }] });
        }
        return jsonResponse({});
      });

      await expect(service.check()).rejects.toThrow(HttpException);
    });

    it('no deja que una dependencia lenta bloquee a las demás (corren en paralelo)', async () => {
      const started: string[] = [];
      jest.spyOn(globalThis, 'fetch').mockImplementation(async (input: unknown) => {
        const url = String(input);
        started.push(url);
        if (url.includes('soroban')) return jsonResponse({ result: { status: 'healthy' } });
        if (url.includes('/accounts/')) {
          return jsonResponse({ balances: [{ asset_type: 'native', balance: '100.0000000' }] });
        }
        return jsonResponse({});
      });

      await service.check();

      // Horizon, Soroban y las dos wallets se piden todos antes de resolver: 4 llamadas fetch.
      expect(started.length).toBe(4);
    });
  });

  describe('GET /api/health', () => {
    let app: INestApplication;

    beforeEach(async () => {
      app = module.createNestApplication();
      app.setGlobalPrefix('api');
      app.useGlobalFilters(new ContractExceptionFilter());
      await app.init();
    });

    afterEach(async () => {
      await app.close();
    });

    it('responde sin credenciales y conserva los detalles ante un fallo crítico', async () => {
      mockHealthyFetch();
      const client = request(app.getHttpServer());
      await client.get('/api/health').expect(200).expect(({ body }) => {
        expect(body).toMatchObject({ status: 'ok', supabase: 'up', stellar: 'up' });
      });

      selectMock.mockResolvedValue({ error: new Error('db down') });
      await client.get('/api/health').expect(503).expect(({ body }) => {
        expect(body).toMatchObject({ status: 'degraded', supabase: 'down', stellar: 'up' });
      });
    });
  });
});
