import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { SupabaseService } from '../common/supabase/supabase.service';
import { HORIZON_URL } from '../escrow/stellar.config';

const TIMEOUT_MS = 3000;

@Injectable()
export class HealthService {
  private readonly startTime = Date.now();

  constructor(private readonly supabase: SupabaseService) {}

  async check() {
    const [supabaseStatus, stellarStatus] = await Promise.all([
      this.checkSupabase(),
      this.checkStellar(),
    ]);

    const allUp = supabaseStatus === 'up' && stellarStatus === 'up';
    const body = {
      status: allUp ? 'ok' : 'degraded',
      supabase: supabaseStatus,
      stellar: stellarStatus,
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
    };

    if (!allUp) {
      throw new HttpException(body, HttpStatus.SERVICE_UNAVAILABLE);
    }

    return body;
  }

  private async checkSupabase(): Promise<'up' | 'down'> {
    try {
      const { error } = await Promise.race([
        this.supabase.admin.from('bonds').select('*', { count: 'exact', head: true }),
        this.timeout(),
      ]) as { error: unknown };
      return error ? 'down' : 'up';
    } catch {
      return 'down';
    }
  }

  private async checkStellar(): Promise<'up' | 'down'> {
    try {
      const res = await Promise.race([
        fetch(`${HORIZON_URL}/`),
        this.timeout(),
      ]) as Response;
      return res.ok ? 'up' : 'down';
    } catch {
      return 'down';
    }
  }

  private timeout(): Promise<never> {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), TIMEOUT_MS),
    );
  }
}
