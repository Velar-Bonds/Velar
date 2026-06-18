import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { Keypair, TransactionBuilder } from '@stellar/stellar-sdk';
import { NETWORK_PASSPHRASE } from './stellar.config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export type CustodyWalletCreation = {
  publicKey: string;
  status: 'created' | 'funded' | 'failed';
  network: 'testnet' | 'mainnet';
  error?: string;
};

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);
  private readonly secretByPublic = new Map<string, string>();
  private readonly nameToPublic = new Map<string, string>();
  private readonly file = path.join(process.cwd(), '.stellar-wallets.json');
  private store: Record<string, { publicKey: string; secret: string }> = {};
  private supabase: SupabaseClient | null = null;

  constructor() {
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      this.supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
      );
    }

    // 1. Wallets fijas desde STELLAR_WALLETS_JSON (producción) o archivo local (dev)
    const fromEnv = process.env.STELLAR_WALLETS_JSON;
    if (fromEnv) {
      try {
        this.store = JSON.parse(fromEnv);
        for (const [name, kp] of Object.entries(this.store)) {
          this.secretByPublic.set(kp.publicKey, kp.secret);
          this.nameToPublic.set(name, kp.publicKey);
        }
        this.logger.log(`Custodia base cargada desde STELLAR_WALLETS_JSON: ${this.secretByPublic.size} wallets`);
      } catch (e) {
        this.logger.error(`STELLAR_WALLETS_JSON inválido: ${(e as Error).message}`);
      }
    } else if (fs.existsSync(this.file)) {
      this.store = JSON.parse(fs.readFileSync(this.file, 'utf8'));
      for (const [name, kp] of Object.entries(this.store)) {
        this.secretByPublic.set(kp.publicKey, kp.secret);
        this.nameToPublic.set(name, kp.publicKey);
      }
      this.logger.log(`Custodia base cargada desde archivo: ${this.secretByPublic.size} wallets`);
    } else {
      this.logger.warn('.stellar-wallets.json no encontrado y STELLAR_WALLETS_JSON no definido.');
    }

    // 2. Wallets de usuarios desde Supabase (async)
    this.loadWalletsFromSupabase().catch((e) =>
      this.logger.warn(`No se pudieron cargar wallets de Supabase: ${(e as Error).message}`),
    );
  }

  private async loadWalletsFromSupabase(): Promise<void> {
    if (!this.supabase) return;
    try {
      const { data, error } = await this.supabase
        .from('custody_wallets')
        .select('label, public_key, secret');
      if (error) throw new Error(error.message);
      if (!data?.length) return;
      for (const row of data) {
        if (!this.secretByPublic.has(row.public_key)) {
          this.secretByPublic.set(row.public_key, row.secret);
          this.nameToPublic.set(row.label, row.public_key);
        }
      }
      this.logger.log(`Wallets de usuarios cargadas desde Supabase: ${data.length}`);
    } catch (e) {
      this.logger.warn(`loadWalletsFromSupabase: ${(e as Error).message}`);
    }
  }

  private async persistWallet(label: string, publicKey: string, secret: string): Promise<void> {
    if (this.supabase) {
      try {
        await this.supabase.from('custody_wallets').upsert(
          { label, public_key: publicKey, secret },
          { onConflict: 'public_key' },
        );
      } catch (e) {
        this.logger.warn(`No se pudo guardar wallet en Supabase: ${(e as Error).message}`);
      }
    }
    if (!process.env.STELLAR_WALLETS_JSON && fs.existsSync(path.dirname(this.file))) {
      try {
        this.store[label] = { publicKey, secret };
        fs.writeFileSync(this.file, JSON.stringify(this.store, null, 2));
      } catch (e) {
        this.logger.warn(`No se pudo guardar wallet en archivo: ${(e as Error).message}`);
      }
    }
  }

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
    const key = `user:${label}:${publicKey.slice(0, 6)}`;
    this.secretByPublic.set(publicKey, kp.secret());
    this.nameToPublic.set(key, publicKey);
    await this.persistWallet(key, publicKey, kp.secret());
    this.logger.log(`Wallet de custodia creada para ${label}: ${publicKey}`);
    return { publicKey, status, network: 'testnet', error };
  }

  async createWallet(label: string): Promise<string> {
    const wallet = await this.createWalletRecord(label);
    return wallet.publicKey;
  }

  get enabled(): boolean { return this.secretByPublic.size > 0; }
  get platformAddress(): string | undefined { return this.nameToPublic.get('platform'); }
  get issuerAddress(): string | undefined { return this.nameToPublic.get('platform'); }
  get escrowAddress(): string | undefined { return this.nameToPublic.get('escrow'); }
  hasKeyFor(publicKey: string): boolean { return this.secretByPublic.has(publicKey); }

  keypairFor(publicKey: string): Keypair {
    const secret = this.secretByPublic.get(publicKey);
    if (!secret) throw new Error(`No hay llave en custodia para ${publicKey}`);
    return Keypair.fromSecret(secret);
  }

  signXdr(unsignedXdr: string, publicKey: string): string {
    const secret = this.secretByPublic.get(publicKey);
    if (!secret) throw new Error(`No hay llave en custodia para ${publicKey}`);
    const tx = TransactionBuilder.fromXDR(unsignedXdr, NETWORK_PASSPHRASE);
    tx.sign(Keypair.fromSecret(secret));
    return tx.toXDR();
  }
}
