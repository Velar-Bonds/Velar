import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { Keypair, Networks, TransactionBuilder } from '@stellar/stellar-sdk';

/**
 * Custodia asistida (SOLO testnet / demo).
 * Carga las llaves de apps/api/.stellar-wallets.json y firma XDR en nombre de
 * una dirección pública. En producción esto se reemplaza por firmas del lado
 * del usuario (wallet propia) — ver docs/BACKEND.md.
 */
@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);
  private readonly secretByPublic = new Map<string, string>();
  private readonly nameToPublic = new Map<string, string>();

  constructor() {
    const file = path.join(process.cwd(), '.stellar-wallets.json');
    if (!fs.existsSync(file)) {
      this.logger.warn(
        '.stellar-wallets.json no encontrado: el escrow on-chain quedará deshabilitado. Corré "npm run provision:wallets".',
      );
      return;
    }
    const data = JSON.parse(fs.readFileSync(file, 'utf8')) as Record<
      string,
      { publicKey: string; secret: string }
    >;
    for (const [name, kp] of Object.entries(data)) {
      this.secretByPublic.set(kp.publicKey, kp.secret);
      this.nameToPublic.set(name, kp.publicKey);
    }
    this.logger.log(`Custodia cargada: ${this.secretByPublic.size} wallets testnet`);
  }

  get enabled(): boolean {
    return this.secretByPublic.size > 0;
  }

  /** Dirección pública de la plataforma (signer del deploy). */
  get platformAddress(): string | undefined {
    return this.nameToPublic.get('platform');
  }

  hasKeyFor(publicKey: string): boolean {
    return this.secretByPublic.has(publicKey);
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
