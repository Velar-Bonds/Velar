import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../common/supabase/supabase.service';
import { WalletService } from '../escrow/wallet.service';

@Injectable()
export class PartiesService {
  constructor(
    private supabase: SupabaseService,
    private wallets: WalletService,
  ) {}

  async findAll() {
    const { data } = await this.supabase.admin
      .from('parties').select('*').order('name');
    return data ?? [];
  }

  async findOne(id: string) {
    const { data } = await this.supabase.admin
      .from('parties').select('*').eq('id', id).single();
    return data;
  }

  async create(body: { code: string; name: string }) {
    const wallet = await this.wallets.createWalletRecord(`party:${body.code}`).catch((error: Error) => ({
      publicKey: null,
      status: 'failed' as const,
      network: 'testnet' as const,
      error: error.message,
    }));
    const row = {
      ...body,
      stellar_wallet: wallet.publicKey,
      stellar_wallet_status: wallet.status,
      stellar_network: wallet.network,
      stellar_created_at: wallet.publicKey ? new Date().toISOString() : null,
      stellar_wallet_error: wallet.error ?? null,
    };
    const { data, error } = await this.supabase.admin
      .from('parties').insert(row).select().single();
    if (error && /column|schema cache/i.test(error.message)) {
      const { data: fallbackData, error: fallbackError } = await this.supabase.admin
        .from('parties').insert(body).select().single();
      if (fallbackError) throw new Error(fallbackError.message);
      return fallbackData;
    }
    if (error) throw new Error(error.message);
    return data;
  }
}
