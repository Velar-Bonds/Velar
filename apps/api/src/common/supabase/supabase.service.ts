import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private adminClient: SupabaseClient;

  constructor(private cfg: ConfigService) {}

  onModuleInit() {
    this.adminClient = createClient(
      this.cfg.getOrThrow('SUPABASE_URL'),
      this.cfg.getOrThrow('SUPABASE_SERVICE_ROLE_KEY'),
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
  }

  get admin(): SupabaseClient {
    return this.adminClient;
  }

  async getUser(token: string) {
    const { data, error } = await this.adminClient.auth.getUser(token);
    if (error) return null;
    return data.user;
  }
}
