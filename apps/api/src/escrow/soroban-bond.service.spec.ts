import { Test, TestingModule } from '@nestjs/testing';
import { Account, Keypair, nativeToScVal } from '@stellar/stellar-sdk';
import { SorobanBondService } from './soroban-bond.service';
import { WalletService } from './wallet.service';

/**
 * Tests del servicio Soroban. El SDK se mockea en su frontera de red
 * (`rpc.Server`): ninguna llamada sale a testnet ni requiere contrato desplegado.
 * El resto del SDK (Keypair, Address, StrKey, TransactionBuilder, nativeToScVal)
 * se usa real para que las transacciones que se construyen sean legítimas.
 */
jest.mock('@stellar/stellar-sdk', () => {
  const actual = jest.requireActual('@stellar/stellar-sdk');
  return {
    ...actual,
    rpc: { ...actual.rpc, Server: jest.fn() },
  };
});

const WASM_HASH = 'ab'.repeat(32); // 64 chars hex, como exige `enabled`
const CONTRACT_ID = `C${'A1B2C3D4E5F6'.repeat(4)}${'789ABC'}`.slice(0, 56);
const PLATFORM_KP = Keypair.random();
const TSE_KP = Keypair.random();
const PARTY_KP = Keypair.random();

/** Doble del `rpc.Server` que inyectamos en el servicio. */
type ServerDouble = {
  getAccount: jest.Mock;
  prepareTransaction: jest.Mock;
  sendTransaction: jest.Mock;
  getTransaction: jest.Mock;
  simulateTransaction: jest.Mock;
};

describe('SorobanBondService', () => {
  let service: SorobanBondService;
  let server: ServerDouble;
  let wallets: { platformAddress: string; keypairFor: jest.Mock };
  let savedEnv: NodeJS.ProcessEnv;

  const bondInput = {
    partyOwner: PARTY_KP.publicKey(),
    partyId: 'party-uuid',
    bondId: 'BOND-001',
    certificateNumber: 'CERT-001',
    series: 'A',
    faceValue: 1_000_000,
    currency: 'CRC',
    interestRateBps: 650,
    issueDate: 1_780_000_000,
    maturityDate: 1_980_000_000,
    documentHash: 'cd'.repeat(32),
  };

  /** `successResult` es lo que devuelve getTransaction() cuando la tx confirma. */
  const successResult = (returnValue?: unknown) => ({
    status: 'SUCCESS',
    ...(returnValue ? { returnValue: nativeToScVal(returnValue as string, { type: 'string' }) } : {}),
  });

  /** Crea el servicio con el env indicado. El env se lee en el constructor. */
  async function createService(env: Record<string, string | undefined> = {}) {
    process.env.SOROBAN_VELAR_BOND_WASM_HASH = WASM_HASH;
    process.env.SOROBAN_TSE_ADDRESS = TSE_KP.publicKey();
    Object.assign(process.env, env);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SorobanBondService,
        { provide: WalletService, useValue: wallets },
      ],
    }).compile();

    const created = module.get(SorobanBondService);
    // El `rpc.Server` se construye como field inicial; lo reemplazamos por el doble.
    (created as unknown as { server: ServerDouble }).server = server;
    return created;
  }

  beforeEach(() => {
    savedEnv = { ...process.env };

    server = {
      getAccount: jest.fn().mockResolvedValue(new Account(PLATFORM_KP.publicKey(), '0')),
      prepareTransaction: jest.fn(async (tx: unknown) => tx),
      sendTransaction: jest.fn().mockResolvedValue({ status: 'PENDING', hash: 'tx-hash' }),
      getTransaction: jest.fn().mockResolvedValue(successResult(CONTRACT_ID)),
      simulateTransaction: jest.fn(),
    };

    wallets = {
      platformAddress: PLATFORM_KP.publicKey(),
      keypairFor: jest.fn().mockReturnValue(PLATFORM_KP),
    };
  });

  afterEach(() => {
    process.env = savedEnv;
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  describe('enabled', () => {
    it('es true con wasm hash, dirección TSE válida y custodia de plataforma', async () => {
      service = await createService();
      expect(service.enabled).toBe(true);
    });

    it('es false si falta SOROBAN_VELAR_BOND_WASM_HASH', async () => {
      process.env.SOROBAN_VELAR_BOND_WASM_HASH = '';
      service = await createService({ SOROBAN_VELAR_BOND_WASM_HASH: '' });
      expect(service.enabled).toBe(false);
    });

    it('es false si el wasm hash no tiene 64 caracteres', async () => {
      service = await createService({ SOROBAN_VELAR_BOND_WASM_HASH: 'abcd' });
      expect(service.enabled).toBe(false);
    });

    it('es false si SOROBAN_TSE_ADDRESS no es una clave pública válida', async () => {
      service = await createService({ SOROBAN_TSE_ADDRESS: 'no-es-una-clave' });
      expect(service.enabled).toBe(false);
    });

    it('es false si la plataforma no tiene wallet de custodia', async () => {
      wallets.platformAddress = '';
      service = await createService();
      expect(service.enabled).toBe(false);
    });
  });

  describe('deployBond()', () => {
    it('despliega e inicializa el contrato, devolviendo contractId e initTxHash', async () => {
      service = await createService();

      const result = await service.deployBond(bondInput);

      expect(result).toEqual({ contractId: CONTRACT_ID, initTxHash: 'tx-hash' });
      // deploy + initialize = 2 transacciones enviadas
      expect(server.sendTransaction).toHaveBeenCalledTimes(2);
      expect(wallets.keypairFor).toHaveBeenCalledWith(PLATFORM_KP.publicKey());
    });

    it('falla si Soroban no está habilitado', async () => {
      service = await createService({ SOROBAN_VELAR_BOND_WASM_HASH: '' });

      await expect(service.deployBond(bondInput)).rejects.toThrow(
        /Soroban no habilitado.*SOROBAN_VELAR_BOND_WASM_HASH/s,
      );
      expect(server.sendTransaction).not.toHaveBeenCalled();
    });

    it('rechaza un partyOwner que no es una clave pública válida', async () => {
      service = await createService();

      await expect(service.deployBond({ ...bondInput, partyOwner: 'G-INVALID' })).rejects.toThrow(
        /partyOwner inválido: G-INVALID/,
      );
      expect(server.sendTransaction).not.toHaveBeenCalled();
    });

    it('propaga el error si falla el deploy antes de inicializar', async () => {
      service = await createService();
      server.sendTransaction.mockResolvedValueOnce({
        status: 'ERROR',
        errorResult: 'Error(Contract, #4)',
      });

      await expect(service.deployBond(bondInput)).rejects.toThrow(
        'Soroban deploy falló: La cuenta no es el TSE autorizado (contract error #4)',
      );
    });

    it('tolera un fallo en initialize y devuelve "deployed-only"', async () => {
      service = await createService();
      // el deploy va bien, initialize es rechazado por la red
      server.sendTransaction
        .mockResolvedValueOnce({ status: 'PENDING', hash: 'deploy-hash' })
        .mockResolvedValueOnce({ status: 'ERROR', errorResult: 'Error(Contract, #1)' });

      const result = await service.deployBond(bondInput);

      expect(result).toEqual({ contractId: CONTRACT_ID, initTxHash: 'deployed-only' });
    });

    it('falla si no se puede extraer el contractId del resultado del deploy', async () => {
      service = await createService();
      server.getTransaction.mockResolvedValue({ status: 'SUCCESS' });

      await expect(service.deployBond(bondInput)).rejects.toThrow(
        'No se pudo extraer contractId del deploy',
      );
    });

    it('falla si el deploy devuelve un contractId con formato inesperado', async () => {
      service = await createService();
      server.getTransaction.mockResolvedValue(successResult('no-es-un-contract-id'));

      await expect(service.deployBond(bondInput)).rejects.toThrow(
        'contractId inesperado en el deploy result',
      );
    });

    it('falla si la transacción nunca confirma dentro de los reintentos', async () => {
      jest.useFakeTimers();
      service = await createService();
      server.getTransaction.mockResolvedValue({ status: 'PENDING' });

      const pending = service.deployBond(bondInput);
      const assertion = expect(pending).rejects.toThrow(/Soroban tx timeout: tx-hash/);
      await jest.advanceTimersByTimeAsync(60_000);

      await assertion;
    });
  });

  describe('readDetails()', () => {
    it('devuelve el valor nativo del contrato', async () => {
      service = await createService();
      server.simulateTransaction.mockResolvedValue({
        result: { retval: nativeToScVal('BOND-001', { type: 'string' }) },
      });

      await expect(service.readDetails(CONTRACT_ID)).resolves.toBe('BOND-001');
      expect(server.simulateTransaction).toHaveBeenCalledTimes(1);
    });

    it('devuelve null si la simulación no trae retval', async () => {
      service = await createService();
      server.simulateTransaction.mockResolvedValue({ result: {} });

      await expect(service.readDetails(CONTRACT_ID)).resolves.toBeNull();
    });

    it('lanza un error legible si la simulación falla', async () => {
      service = await createService();
      server.simulateTransaction.mockResolvedValue({ error: 'Error(Contract, #2)' });

      await expect(service.readDetails(CONTRACT_ID)).rejects.toThrow(
        'El bono no ha sido inicializado (contract error #2)',
      );
    });
  });

  describe('setDocumentHash()', () => {
    const DOC_HASH = 'ef'.repeat(32);

    it('envía la operación y devuelve el hash de la transacción', async () => {
      service = await createService();
      server.sendTransaction.mockResolvedValue({ status: 'PENDING', hash: 'dochash-hash' });
      server.getTransaction.mockResolvedValue(successResult());

      await expect(service.setDocumentHash(CONTRACT_ID, DOC_HASH)).resolves.toBe('dochash-hash');
      expect(server.sendTransaction).toHaveBeenCalledTimes(1);
    });

    it('falla si Soroban no está habilitado', async () => {
      service = await createService({ SOROBAN_VELAR_BOND_WASM_HASH: '' });

      await expect(service.setDocumentHash(CONTRACT_ID, DOC_HASH)).rejects.toThrow(
        'Soroban no habilitado',
      );
    });

    it.each([
      ['hash muy corto', 'abcd'],
      ['caracteres no hexadecimales', 'z'.repeat(64)],
      ['hash de 63 caracteres', 'a'.repeat(63)],
    ])('rechaza un documentHash inválido (%s)', async (_label, invalid) => {
      service = await createService();

      await expect(service.setDocumentHash(CONTRACT_ID, invalid)).rejects.toThrow(
        'documentHash debe ser exactamente 64 caracteres hexadecimales (SHA-256)',
      );
      expect(server.sendTransaction).not.toHaveBeenCalled();
    });

    it('traduce el error de contrato cuando la red rechaza la operación', async () => {
      service = await createService();
      server.sendTransaction.mockResolvedValue({
        status: 'ERROR',
        errorResult: 'Error(Contract, #4)',
      });

      await expect(service.setDocumentHash(CONTRACT_ID, DOC_HASH)).rejects.toThrow(
        'Soroban set_document_hash falló: La cuenta no es el TSE autorizado (contract error #4)',
      );
    });

    it('falla si la transacción queda en estado FAILED', async () => {
      service = await createService();
      server.getTransaction.mockResolvedValue({ status: 'FAILED' });

      await expect(service.setDocumentHash(CONTRACT_ID, DOC_HASH)).rejects.toThrow(
        'Soroban tx failed: dochash-hash',
      );
    });
  });

  describe('contractExplorerUrl()', () => {
    it('apunta al contrato en el explorador de la red configurada', async () => {
      service = await createService();
      const url = service.contractExplorerUrl(CONTRACT_ID);

      expect(url).toContain(`/contract/${CONTRACT_ID}`);
      expect(url.startsWith('https://stellar.expert/explorer/')).toBe(true);
    });
  });
});
