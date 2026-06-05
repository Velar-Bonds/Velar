import { Injectable, Logger } from '@nestjs/common';
import {
  Address,
  Contract,
  Networks,
  Operation,
  StrKey,
  TransactionBuilder,
  BASE_FEE,
  scValToNative,
  nativeToScVal,
  rpc,
} from '@stellar/stellar-sdk';
import { WalletService } from './wallet.service';

const SOROBAN_RPC = 'https://soroban-testnet.stellar.org';
const NET = Networks.TESTNET;

/**
 * Despliega y opera contratos Soroban `VelarBond`.
 *
 * Cada bono se vuelve un contrato individual con TODA su metadata on-chain
 * (monto, fechas, dueño, partido, hash del documento, estado). Postgres
 * queda como cache para búsquedas rápidas.
 *
 * Se activa solo si `SOROBAN_VELAR_BOND_WASM_HASH` está definido en `.env`.
 * Si no está, el sistema sigue emitiendo Classic Assets (compatibilidad).
 *
 * Variables de entorno:
 *   SOROBAN_VELAR_BOND_WASM_HASH=<hex 64 chars del wasm subido>
 *   SOROBAN_TSE_ADDRESS=<wallet del TSE que firma initialize>
 */
@Injectable()
export class SorobanBondService {
  private readonly logger = new Logger(SorobanBondService.name);
  private readonly wasmHash = process.env.SOROBAN_VELAR_BOND_WASM_HASH ?? '';
  private readonly tseAddress = process.env.SOROBAN_TSE_ADDRESS ?? '';
  private readonly server = new rpc.Server(SOROBAN_RPC);

  constructor(private wallets: WalletService) {}

  /** El servicio está listo si tenemos wasm hash + cuenta TSE + custodia. */
  get enabled(): boolean {
    return (
      this.wasmHash.length === 64 &&
      StrKey.isValidEd25519PublicKey(this.tseAddress) &&
      !!this.wallets.platformAddress
    );
  }

  /**
   * Despliega un contrato `VelarBond` nuevo y lo inicializa con los datos
   * del bono. Devuelve el contractId que debe guardarse en `bonds.soroban_contract_id`.
   */
  async deployBond(input: {
    partyOwner: string;
    partyId: string;
    bondId: string;
    certificateNumber: string;
    series: string;
    faceValue: number;
    currency: string;
    interestRateBps: number;
    issueDate: number;
    maturityDate: number;
    documentHash: string;
  }): Promise<{ contractId: string; initTxHash: string }> {
    if (!this.enabled) {
      throw new Error(
        'Soroban no habilitado. Setear SOROBAN_VELAR_BOND_WASM_HASH y SOROBAN_TSE_ADDRESS en .env',
      );
    }
    if (!StrKey.isValidEd25519PublicKey(input.partyOwner)) {
      throw new Error(`partyOwner inválido: ${input.partyOwner}`);
    }

    const sourceAddress = this.wallets.platformAddress!;
    const sourceKp = this.wallets.keypairFor(sourceAddress);

    // ── Paso 1: deploy del contrato (crea una instancia a partir del WASM ya subido)
    const account = await this.server.getAccount(sourceAddress);
    const wasmHashBuf = Buffer.from(this.wasmHash, 'hex');

    const deployOp = Operation.createCustomContract({
      address: Address.fromString(sourceAddress),
      wasmHash: wasmHashBuf,
    });

    const deployTx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: NET,
    })
      .addOperation(deployOp)
      .setTimeout(60)
      .build();

    const prepared = await this.server.prepareTransaction(deployTx);
    prepared.sign(sourceKp);
    const deployRes = await this.server.sendTransaction(prepared);
    if (deployRes.status === 'ERROR') {
      throw new Error(`Soroban deploy falló: ${JSON.stringify(deployRes.errorResult)}`);
    }

    const deployStatus = await this.pollUntilSuccess(deployRes.hash);
    const contractId = this.extractContractId(deployStatus);
    this.logger.log(`Bono ${input.bondId} desplegado: contract=${contractId} tx=${deployRes.hash}`);

    // ── Paso 2: initialize con todos los atributos
    const contract = new Contract(contractId);
    const initAccount = await this.server.getAccount(sourceAddress);
    const initOp = contract.call(
      'initialize',
      Address.fromString(this.tseAddress).toScVal(),
      nativeToScVal(input.partyId, { type: 'string' }),
      Address.fromString(input.partyOwner).toScVal(),
      nativeToScVal(input.bondId, { type: 'string' }),
      nativeToScVal(input.certificateNumber, { type: 'string' }),
      nativeToScVal(input.series, { type: 'string' }),
      nativeToScVal(BigInt(Math.round(input.faceValue)), { type: 'i128' }),
      nativeToScVal(input.currency, { type: 'symbol' }),
      nativeToScVal(input.interestRateBps, { type: 'u32' }),
      nativeToScVal(BigInt(input.issueDate), { type: 'u64' }),
      nativeToScVal(BigInt(input.maturityDate), { type: 'u64' }),
      nativeToScVal(Buffer.from(input.documentHash, 'hex'), { type: 'bytes' }),
    );

    const initTx = new TransactionBuilder(initAccount, {
      fee: BASE_FEE,
      networkPassphrase: NET,
    })
      .addOperation(initOp)
      .setTimeout(60)
      .build();

    const preparedInit = await this.server.prepareTransaction(initTx);
    preparedInit.sign(sourceKp);
    const initRes = await this.server.sendTransaction(preparedInit);
    if (initRes.status === 'ERROR') {
      throw new Error(`Soroban initialize falló: ${JSON.stringify(initRes.errorResult)}`);
    }
    await this.pollUntilSuccess(initRes.hash);
    this.logger.log(`Bono ${input.bondId} inicializado on-chain (${initRes.hash})`);

    return { contractId, initTxHash: initRes.hash };
  }

  /** Lee los atributos del bono directamente del contrato (gratis, simulación). */
  async readDetails(contractId: string): Promise<unknown> {
    const contract = new Contract(contractId);
    const account = await this.server.getAccount(this.wallets.platformAddress!);
    const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: NET })
      .addOperation(contract.call('details'))
      .setTimeout(60)
      .build();
    const sim = await this.server.simulateTransaction(tx);
    if ('error' in sim) throw new Error(sim.error);
    const retval = (sim as any).result?.retval;
    return retval ? scValToNative(retval) : null;
  }

  contractExplorerUrl(contractId: string): string {
    return `https://stellar.expert/explorer/testnet/contract/${contractId}`;
  }

  // ─── Internos ────────────────────────────────────────────────────────────

  private async pollUntilSuccess(hash: string, maxAttempts = 30): Promise<any> {
    for (let i = 0; i < maxAttempts; i++) {
      const r = await this.server.getTransaction(hash);
      if (r.status === 'SUCCESS') return r;
      if (r.status === 'FAILED') throw new Error(`Soroban tx failed: ${hash}`);
      await new Promise((res) => setTimeout(res, 1000));
    }
    throw new Error(`Soroban tx timeout: ${hash}`);
  }

  private extractContractId(txResult: any): string {
    const retval =
      txResult.returnValue ??
      txResult.resultMetaXdr?.v3?.()?.sorobanMeta?.()?.returnValue?.();
    if (!retval) throw new Error('No se pudo extraer contractId del deploy');
    const native = scValToNative(retval);
    if (typeof native === 'string' && native.startsWith('C')) return native;
    if (native?.contract) return native.contract;
    throw new Error('contractId inesperado en el deploy result');
  }
}
