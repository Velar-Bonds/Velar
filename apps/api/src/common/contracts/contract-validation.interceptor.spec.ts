import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import {
  apiContracts,
  apiErrorResponseSchema,
  ErrorCode,
  findContract,
  type EndpointName,
} from '@velar/types';
import { validateContractRequest, validateContractResponse } from './contract-validation.interceptor';

const request = (body: unknown = undefined, params: unknown = {}, query: unknown = {}) => ({ body, params, query });

describe('shared contract boundary', () => {
  const invalidCases: Array<[EndpointName, ReturnType<typeof request>]> = [
    ['auth.register', request({ email: 'bad', password: 'short', perspectiva: 'usuario' })],
    ['bonds.create', request({}, {}, {})],
    ['transfers.create', request({}, {}, {})],
    ['reports.create', request({ title: '', description: '' }, {}, {})],
    ['transfers.submitXdr', request({ signedXdr: '' }, { id: 'transfer-1' }, {})],
    ['notifications.read', request(undefined, { id: '' }, {})],
    ['users.updateWallet', request({ publicKey: 'invalid' }, {}, {})],
  ];

  const validCases: Array<[EndpointName, ReturnType<typeof request>]> = [
    ['auth.register', request({
      email: 'persona@example.com', password: 'segura-123', perspectiva: 'usuario',
      nombres: 'Ana', apellidos: 'Solano', identificacion: '1-1234-5678',
    })],
    ['bonds.create', request({
      bondId: 'B-001', issuerPartyId: 'party-1', documentHash: 'pending-document', faceValue: '1000',
    })],
    ['transfers.create', request({ bondTokenId: 'bond-1', amount: '1000', paymentMethod: 'sinpe' })],
    ['reports.create', request({ title: 'Q1', description: 'Detalle', total_amount: '1000' })],
    ['transfers.submitXdr', request({ signedXdr: 'AAAA' }, { id: 'transfer-1' })],
    ['notifications.read', request(undefined, { id: 'notification-1' })],
    ['users.updateWallet', request({ publicKey: `G${'A'.repeat(55)}` })],
  ];

  it.each(invalidCases)('rejects invalid %s requests with localized structured errors', (name, parts) => {
    try {
      validateContractRequest(apiContracts[name], parts, 'es');
      throw new Error('Expected validation to fail');
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      const parsed = apiErrorResponseSchema.parse((error as BadRequestException).getResponse());
      expect(parsed.error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(parsed.error.message).toBe('Los datos enviados no son válidos.');
      expect(parsed.error.fields).toBeDefined();
    }
  });

  it.each(validCases)('accepts valid %s requests at the shared boundary', (name, parts) => {
    expect(() => validateContractRequest(apiContracts[name], parts, 'es')).not.toThrow();
  });

  it('accepts a valid request without changing the business payload', () => {
    const body = { bondTokenId: 'bond-1', amount: 1000, paymentMethod: 'sinpe' as const };
    const parsed = validateContractRequest(apiContracts['transfers.create'], request(body), 'es');
    expect(parsed.body).toEqual(body);
  });

  it('catches handler response drift in dev/test', () => {
    expect(() => validateContractResponse(apiContracts['bonds.create'], { status: 'activo' }, 'en'))
      .toThrow(InternalServerErrorException);
    try {
      validateContractResponse(apiContracts['bonds.create'], { status: 'activo' }, 'en');
    } catch (error) {
      const parsed = apiErrorResponseSchema.parse((error as InternalServerErrorException).getResponse());
      expect(parsed.error.code).toBe(ErrorCode.RESPONSE_VALIDATION_ERROR);
      expect(parsed.error.message).toBe('The API response does not match the contract.');
    }
  });

  it('matches every declared contract by method and path', () => {
    for (const [name, contract] of Object.entries(apiContracts)) {
      const concretePath = contract.path.replace(/:[^/]+/g, 'fixture-id');
      expect(findContract(contract.method, `/api${concretePath}`)?.name).toBe(name);
    }
  });

  it('covers every required module, including escrow operations', () => {
    const modules = new Set(Object.values(apiContracts).map((contract) => contract.module));
    expect(modules).toEqual(new Set(['auth', 'bonds', 'transfers', 'reports', 'escrow', 'notifications', 'users']));
  });
});
