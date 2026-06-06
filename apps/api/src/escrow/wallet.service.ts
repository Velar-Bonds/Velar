import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { Keypair, Networks, TransactionBuilder } from '@stellar/stellar-sdk';

export type CustodyWalletCreation = {
  publicKey: string;
  status: 'created' | 'funded' | 'failed';
  network: 'testnet' | 'mainnet';
  error?: string;
};

/**
 * Custodia asistida (SOLO testnet / demo).
 * Carga las llaves de apps/api/.stellar-wallets.json y firma XDR en nombre de
 * una dirección pública. En producción esto se reemplaza por firmas del lado
 * del usuario (wallet propia) : ver docs/BACKEND.md.
 */
@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);
  private readonly secretByPublic = new Map<string, string>();
  private readonly nameToPublic = new Map<string, string>();
  private readonly file = path.join(process.cwd(), '.stellar-wallets.json');
  private store: Record<string, { publicKey: string; secret: string }> = {};

  constructor() {
    if (!fs.existsSync(this.file)) {
      this.logger.warn(
        '.stellar-wallets.json no encontrado: el escrow on-chain quedará deshabilitado. Corré "npm run provision:wallets".',
      );
      return;
    }
    this.store = JSON.parse(fs.readFileSync(this.file, 'utf8'));
    for (const [name, kp] of Object.entries(this.store)) {
      this.secretByPublic.set(kp.publicKey, kp.secret);
      this.nameToPublic.set(name, kp.publicKey);
    }
    this.logger.log(`Custodia cargada: ${this.secretByPublic.size} wallets testnet`);
  }

  /**
   * Crea una wallet de custodia nueva para un usuario/partido recién registrado:
   * genera el par de llaves, la fondea con XLM (Friendbot, testnet) y la guarda.
   * Devuelve la dirección pública (que se guarda en profiles.stellar_wallet).
   */
  async createWalletRecord(label: string): Promise<CustodyWalletCreation> {
    const kp = Keypair.random();
    const publicKey = kp.publicKey();
    let status: CustodyWalletCreation['status'] = 'created';
    let error: string | undefined;
    try {
      if (process.env.STELLAR_ENABLE_FRIENDBOT !== 'false') {
        const res = await fetch(`https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`);
        if (!res.ok && res.status !== 400) throw new Error(`friendbot ${res.status}`);
        status = 'funded';
      }
    } catch (e) {
      error = (e as Error).message;
      status = 'failed';
      this.logger.warn(`Friendbot falló para ${label}: ${error}`);
    }
    this.store[`user:${label}:${publicKey.slice(0, 6)}`] = { publicKey, secret: kp.secret() };
    this.secretByPublic.set(publicKey, kp.secret());
    fs.writeFileSync(this.file, JSON.stringify(this.store, null, 2));
    this.logger.log(`Wallet de custodia creada para ${label}: ${publicKey}`);
    return { publicKey, status, network: 'testnet', error };
  }

  async createWallet(label: string): Promise<string> {
    const wallet = await this.createWalletRecord(label);
    return wallet.publicKey;
  }

  get enabled(): boolean {
    return this.secretByPublic.size > 0;
  }

  /** Dirección pública de la plataforma (emisora de los tokens de bono). */
  get platformAddress(): string | undefined {
    return this.nameToPublic.get('platform');
  }

  /** Cuenta emisora de los activos de bono (= plataforma). */
  get issuerAddress(): string | undefined {
    return this.nameToPublic.get('platform');
  }

  /** Cuenta de la canasta de escrow. */
  get escrowAddress(): string | undefined {
    return this.nameToPublic.get('escrow');
  }

  hasKeyFor(publicKey: string): boolean {
    return this.secretByPublic.has(publicKey);
  }

  /** Keypair en custodia para una dirección pública (para firmar transacciones). */
  keypairFor(publicKey: string): Keypair {
    const secret = this.secretByPublic.get(publicKey);
    if (!secret) throw new Error(`No hay llave en custodia para ${publicKey}`);
    return Keypair.fromSecret(secret);
  }

  /** Firma un XDR (Soroban/Stellar) en nombre de `publicKey` y devuelve el XDR firmado. */
  signXdr(unsignedXdr: string, publicKey: string): string {
    const secret = this.secretByPublic.get(publicKey);
    if (!secret) {
      throw new Error(`No hay llave en custodia para ${publicKey}`);
    }
    const tx = TransactionBuilder.fromXDR(unsignedXdr, Networks.TESTNET);
    tx.sign(Keypair.fromSecret(secret));
    return tx.toXDR();
  }
}
