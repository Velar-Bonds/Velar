import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { SupabaseService } from '../common/supabase/supabase.service';
import { WalletService } from '../escrow/wallet.service';

export type Perspectiva = 'usuario' | 'partido';

export interface RegisterInput {
  email: string;
  password: string;
  perspectiva: Perspectiva;
  // Usuario (comprador/recomprador)
  nombres?: string;
  apellidos?: string;
  identificacion?: string;
  telefono?: string;
  direccion?: string;
  // Partido
  nombrePartido?: string;
  codigo?: string;
  representanteLegal?: string;
  cedulaJuridica?: string;
}

/**
 * Registro de cuentas con las 3 perspectivas:
 *  - usuario  -> rol 'comprador' (comprador = recomprador = usuario)
 *  - partido  -> rol 'emisor' + crea la fila en parties
 *  - (tse/admin se siembran, no se auto-registran)
 *
 * A cada cuenta se le crea una wallet de custodia en Stellar (invisible para el usuario)
 * para que pueda tener los tokens de bono on-chain.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private supabase: SupabaseService,
    private wallets: WalletService,
  ) {}

  async register(input: RegisterInput) {
    if (!input.email || !input.password) {
      throw new BadRequestException('email y password son obligatorios');
    }
    const db = this.supabase.admin;

    // 1) Crear usuario de auth (confirmado, sin email de verificación para la demo).
    const { data: created, error: cErr } = await db.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
      user_metadata: { full_name: this.fullName(input) },
    });
    if (cErr || !created?.user) {
      throw new BadRequestException(cErr?.message ?? 'No se pudo crear la cuenta');
    }
    const userId = created.user.id;

    try {
      // 2) Si es partido, crear/asegurar la fila en parties.
      let partyId: string | null = null;
      if (input.perspectiva === 'partido') {
        if (!input.nombrePartido || !input.codigo) {
          throw new BadRequestException('El partido requiere nombre y código');
        }
        const full = {
          code: input.codigo, name: input.nombrePartido,
          representante_legal: input.representanteLegal ?? null,
          cedula_juridica: input.cedulaJuridica ?? null,
        };
        let { data: party, error: pErr } = await db
          .from('parties').upsert(full, { onConflict: 'code' }).select().single();
        if (pErr && /column|schema cache/i.test(pErr.message)) {
          ({ data: party, error: pErr } = await db
            .from('parties').upsert({ code: input.codigo, name: input.nombrePartido }, { onConflict: 'code' }).select().single());
        }
        if (pErr) throw new BadRequestException(pErr.message);
        partyId = party.id;
      }

      // 3) Crear wallet de custodia (Stellar testnet).
      let wallet: string | null = null;
      if (this.wallets.enabled || true) {
        try {
          wallet = await this.wallets.createWallet(input.email);
        } catch (e) {
          this.logger.warn(`No se pudo crear wallet: ${(e as Error).message}`);
        }
      }

      // 4) Completar el profile (lo creó el trigger handle_new_user) con la info.
      const role = input.perspectiva === 'partido' ? 'emisor' : 'comprador';
      const core = { role, full_name: this.fullName(input), party_id: partyId, stellar_wallet: wallet };
      const extra = {
        nombres: input.nombres ?? null,
        apellidos: input.apellidos ?? null,
        identificacion: input.identificacion ?? null,
        telefono: input.telefono ?? null,
        direccion: input.direccion ?? null,
      };
      let { error: uErr } = await db.from('profiles').update({ ...core, ...extra }).eq('id', userId);
      if (uErr && /column|schema cache/i.test(uErr.message)) {
        // La migración de campos de registro aún no se aplicó: guardamos lo básico.
        this.logger.warn('Campos de registro no existen aún (aplicá la migración). Guardo lo básico.');
        ({ error: uErr } = await db.from('profiles').update(core).eq('id', userId));
      }
      if (uErr) throw new BadRequestException(uErr.message);

      return { id: userId, email: input.email, role, perspectiva: input.perspectiva, partyId, wallet };
    } catch (e) {
      // Rollback: si algo falló luego de crear el auth user, lo borramos.
      await db.auth.admin.deleteUser(userId).catch(() => undefined);
      throw e;
    }
  }

  private fullName(i: RegisterInput): string {
    if (i.perspectiva === 'partido') return i.nombrePartido ?? i.email;
    return [i.nombres, i.apellidos].filter(Boolean).join(' ') || i.email;
  }
}
