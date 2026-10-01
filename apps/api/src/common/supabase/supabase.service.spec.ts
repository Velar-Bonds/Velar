import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

/**
 * Wrapper central de Supabase (admin client + resolución de token).
 * Todo contra un `@supabase/supabase-js` mockeado: no hay red, ni proyecto
 * real de Supabase, ni credenciales de VELAR.
 */
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

const SUPABASE_URL = 'https://proyecto-falso.supabase.co';
const SERVICE_ROLE_KEY = 'service-role-key-falsa';

const USER = {
  id: 'user-1',
  email: 'partido@velar.co',
} as unknown as Record<string, unknown>;

/** ConfigService mínimo: replica el `getOrThrow` real (lanza si falta la clave). */
function fakeConfig(values: Record<string, string>) {
  return {
    getOrThrow: jest.fn((key: string) => {
      if (!(key in values)) throw new Error(`Configuration key "${key}" does not exist`);
      return values[key];
    }),
    get: jest.fn((key: string) => values[key]),
  };
}

describe('SupabaseService', () => {
  let service: SupabaseService;
  let getUserMock: jest.Mock;
  let fakeClient: { auth: { getUser: jest.Mock } };
  let createClientMock: jest.MockedFunction<typeof createClient>;
  let config: ReturnType<typeof fakeConfig>;

  beforeEach(async () => {
    jest.clearAllMocks();

    getUserMock = jest.fn();
    fakeClient = { auth: { getUser: getUserMock } };
    createClientMock = createClient as unknown as jest.MockedFunction<typeof createClient>;
    createClientMock.mockReturnValue(fakeClient as never);

    config = fakeConfig({
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: SERVICE_ROLE_KEY,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [SupabaseService, { provide: ConfigService, useValue: config }],
    }).compile();

    service = module.get(SupabaseService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('onModuleInit()', () => {
    it('crea el admin client con la URL y la service role key de configuración', () => {
      service.onModuleInit();

      expect(createClientMock).toHaveBeenCalledTimes(1);
      expect(createClientMock).toHaveBeenCalledWith(
        SUPABASE_URL,
        SERVICE_ROLE_KEY,
        expect.anything(),
      );
    });

    it('desactiva el refresh y la persistencia de sesión (admin, no usuario final)', () => {
      service.onModuleInit();

      expect(createClientMock).toHaveBeenCalledWith(SUPABASE_URL, SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
    });

    it('propaga el error si falta la configuración requerida y no crea el client', () => {
      config.getOrThrow = jest.fn((key: string) => {
        if (key === 'SUPABASE_SERVICE_ROLE_KEY') throw new Error('falta la service role key');
        return SUPABASE_URL;
      });

      expect(() => service.onModuleInit()).toThrow('falta la service role key');
      expect(createClientMock).not.toHaveBeenCalled();
    });

    it('re-crea el client si se vuelve a inicializar el módulo', () => {
      service.onModuleInit();
      service.onModuleInit();

      expect(createClientMock).toHaveBeenCalledTimes(2);
    });
  });

  describe('admin', () => {
    it('expone el client creado en onModuleInit', () => {
      service.onModuleInit();

      expect(service.admin).toBe(fakeClient);
    });

    it('devuelve la misma instancia en lecturas sucesivas', () => {
      service.onModuleInit();

      expect(service.admin).toBe(service.admin);
    });
  });

  describe('getUser(token)', () => {
    beforeEach(() => {
      service.onModuleInit();
    });

    it('devuelve el usuario cuando Supabase responde sin error', async () => {
      getUserMock.mockResolvedValue({ data: { user: USER }, error: null });

      await expect(service.getUser('token-valido')).resolves.toBe(USER);
      expect(getUserMock).toHaveBeenCalledWith('token-valido');
    });

    it('devuelve null en vez de lanzar cuando Supabase devuelve error (token inválido)', async () => {
      getUserMock.mockResolvedValue({
        data: { user: null },
        error: { message: 'invalid JWT', status: 401 },
      });

      await expect(service.getUser('token-invalido')).resolves.toBeNull();
    });

    it('devuelve null aunque venga data junto al error (el error manda)', async () => {
      getUserMock.mockResolvedValue({
        data: { user: USER },
        error: { message: 'boom' },
      });

      await expect(service.getUser('token')).resolves.toBeNull();
    });

    it('propaga el error si el cliente lanza (fallo de red, no un error de auth)', async () => {
      // Frontera deliberada del wrapper: getUser() solo inspecciona el campo
      // `error` del resultado; un rechazo del cliente sube al llamador.
      const boom = new Error('fetch failed');
      getUserMock.mockRejectedValue(boom);

      await expect(service.getUser('token')).rejects.toBe(boom);
      expect(getUserMock).toHaveBeenCalledTimes(1);
    });
  });
});
