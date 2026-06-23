import { Injectable, Logger } from '@nestjs/common';
import {
  Address,
  Contract,
  Keypair,
  Operation,
  StrKey,
  TransactionBuilder,
  BASE_FEE,
  scValToNative,
  nativeToScVal,
  rpc,
  xdr,
} from '@stellar/stellar-sdk';
import { WalletService } from './wallet.service';
import {
  SOROBAN_RPC_URL,
  NETWORK_PASSPHRASE,
  explorerContractUrl,
  describeContractError,
} from './stellar.config';

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
  private readonly server = new rpc.Server(SOROBAN_RPC_URL);

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
    const wasmHashBuf = Buffer.from(this.wasmHash, 'hex');

    const deployOp = Operation.createCustomContract({
      address: Address.fromString(sourceAddress),
      wasmHash: wasmHashBuf,
    });

    const { hash: deployHash, result: deployStatus } = await this.submitOp(
      deployOp,
      sourceKp,
      'deploy',
    );
    const contractId = this.extractContractId(deployStatus);
    this.logger.log(`Bono ${input.bondId} desplegado: contract=${contractId} tx=${deployHash}`);

    // ── Paso 2: initialize con todos los atributos.
    // Soroban limita las funciones a 10 parámetros, así que el contrato
    // recibe `(tse, args)` donde `args` es un struct InitArgs.
    const contract = new Contract(contractId);

    const initArgs = nativeToScVal(
      {
        party_id: input.partyId,
        party_owner: Address.fromString(input.partyOwner),
        bond_id: input.bondId,
        certificate_number: input.certificateNumber,
        series: input.series,
        face_value: BigInt(Math.round(input.faceValue)),
        currency: input.currency, // se marca como Symbol abajo
        interest_rate_bps: input.interestRateBps,
        issue_date: BigInt(input.issueDate),
        maturity_date: BigInt(input.maturityDate),
        document_hash: Buffer.from(input.documentHash, 'hex'),
      },
      {
        type: {
          party_id: ['symbol', 'string'],
          party_owner: ['symbol', null],
          bond_id: ['symbol', 'string'],
          certificate_number: ['symbol', 'string'],
          series: ['symbol', 'string'],
          face_value: ['symbol', 'i128'],
          currency: ['symbol', 'symbol'],
          interest_rate_bps: ['symbol', 'u32'],
          issue_date: ['symbol', 'u64'],
          maturity_date: ['symbol', 'u64'],
          document_hash: ['symbol', 'bytes'],
        },
      },
    );

    const initOp = contract.call(
      'initialize',
      Address.fromString(this.tseAddress).toScVal(),
      initArgs,
    );

    let initTxHash: string | undefined;
    try {
      const { hash } = await this.submitOp(initOp, sourceKp, 'initialize');
      initTxHash = hash;
      this.logger.log(`Bono ${input.bondId} inicializado on-chain (${initTxHash})`);
    } catch (e) {
      // El contrato se desplegó pero initialize falló. Devolvemos el contractId
      // igual para que se guarde en BD y el chip aparezca. El init se puede
      // re-intentar después o el contrato puede usarse solo para auditoría.
      this.logger.warn(`initialize falló pero contrato ${contractId} fue desplegado: ${(e as Error).message}`);
    }

    return { contractId, initTxHash: initTxHash ?? `deployed-only` };
  }

  /** Lee los atributos del bono directamente del contrato (gratis, simulación). */
  async readDetails(contractId: string): Promise<unknown> {
    const contract = new Contract(contractId);
    const account = await this.server.getAccount(this.wallets.platformAddress!);
    const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: NETWORK_PASSPHRASE })
      .addOperation(contract.call('details'))
      .setTimeout(60)
      .build();
    const sim = await this.server.simulateTransaction(tx);
    if ('error' in sim) throw new Error(describeContractError(sim.error));
    const retval = (sim as any).result?.retval;
    return retval ? scValToNative(retval) : null;
  }

  /** Actualiza el hash del documento PDF on-chain. Requiere Soroban habilitado. */
  async setDocumentHash(contractId: string, documentHash: string): Promise<string> {
    if (!this.enabled) throw new Error('Soroban no habilitado');
    if (!/^[a-fA-F0-9]{64}$/.test(documentHash)) {
      throw new Error('documentHash debe ser exactamente 64 caracteres hexadecimales (SHA-256)');
    }

    const contract = new Contract(contractId);
    const sourceKp = this.wallets.keypairFor(this.wallets.platformAddress!);

    const op = contract.call(
      'set_document_hash',
      nativeToScVal(Buffer.from(documentHash, 'hex'), { type: 'bytes' }),
    );

    const { hash } = await this.submitOp(op, sourceKp, 'set_document_hash');
    this.logger.log(`set_document_hash en ${contractId}: tx=${hash}`);
    return hash;
  }

  contractExplorerUrl(contractId: string): string {
    return explorerContractUrl(contractId);
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

  /**
   * Construye, prepara, firma y envía una operación Soroban, esperando a que
   * confirme. Devuelve el hash y el resultado final de la tx. Lanza un error
   * legible (mapeado con describeContractError) si la red rechaza la operación.
   */
  private async submitOp(
    op: xdr.Operation,
    signerKp: Keypair,
    label: string,
  ): Promise<{ hash: string; result: any }> {
    const account = await this.server.getAccount(signerKp.publicKey());
    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(op)
      .setTimeout(60)
      .build();
    const prepared = await this.server.prepareTransaction(tx);
    prepared.sign(signerKp);
    const res = await this.server.sendTransaction(prepared);
    if (res.status === 'ERROR') {
      throw new Error(`Soroban ${label} falló: ${describeContractError(res.errorResult)}`);
    }
    const result = await this.pollUntilSuccess(res.hash);
    return { hash: res.hash, result };
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
