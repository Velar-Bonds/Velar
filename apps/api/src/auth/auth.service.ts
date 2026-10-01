import { Inject, Injectable, BadRequestException, Logger, UnauthorizedException, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../common/supabase/supabase.service';
import { WalletService } from '../escrow/wallet.service';
import { AuditService } from '../audit/audit.service';
import { AuditEventType } from '@velar/types';
import type { LoginRequest, RegisterRequest } from '@velar/types';

export type Perspectiva = RegisterRequest['perspectiva'];
export type RegisterInput = RegisterRequest;
export type LoginInput = LoginRequest;

/**
 * Registro de cuentas con las 3 perspectivas:
 *  - usuario  -> rol 'comprador' (comprador = recomprador = usuario)
 *  - partido  -> rol 'emisor' + crea la fila en parties
 *  - (tse/admin se siembran, no se auto-registran)
 *
 * A Cada cuenta se le crea una wallet de custodia en Stellar (invisible para el usuario)
 * para que pueda tener los tokens de bono on-chain.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private supabase: SupabaseService,
    private wallets: WalletService,
    @Inject(forwardRef(() => AuditService)) private audit: AuditService,
    private cfg: ConfigService,
  ) {}

  async login(input: LoginInput) {
    if (!input.email || !input.password) {
      throw new BadRequestException('email y password son obligatorios');
    }

    const { data, error } = await this.supabase.admin.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });

    if (error || !data.session) {
      throw new UnauthorizedException(error?.message ?? 'Credenciales invalidas');
    }

    return {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_in: data.session.expires_in,
      token_type: data.session.token_type,
      user: data.user,
    };
  }

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
      let partyWallet: string | null = null;
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
        const partyRow = party as { id: string; stellar_wallet?: string | null };
        partyId = partyRow.id;
        partyWallet = partyRow.stellar_wallet ?? null;
      }

      // 3) Crear wallet de custodia (Stellar testnet).
      let wallet: string | null = partyWallet;
      let walletStatus: string | null = partyWallet ? 'funded' : null;
      let walletNetwork: string | null = partyWallet ? 'testnet' : null;
      let walletError: string | null = null;
      let walletCreatedAt: string | null = partyWallet ? new Date().toISOString() : null;
      if (!wallet) {
        try {
          const createdWallet = await this.wallets.createWalletRecord(input.email);
          wallet = createdWallet.publicKey;
          walletStatus = createdWallet.status;
          walletNetwork = createdWallet.network;
          walletError = createdWallet.error ?? null;
          walletCreatedAt = new Date().toISOString();
        } catch (e) {
          walletStatus = 'failed';
          walletError = (e as Error).message;
          this.logger.warn(`No se pudo crear wallet: ${walletError}`);
        }
      }
      if (partyId && wallet && !partyWallet) {
        try {
          await db.from('parties').update({
            stellar_wallet: wallet,
            stellar_wallet_status: walletStatus ?? 'created',
            stellar_network: walletNetwork ?? 'testnet',
            stellar_created_at: walletCreatedAt,
            stellar_wallet_error: walletError,
          }).eq('id', partyId);
        } catch {
          // Older schemas do not have party wallet metadata yet.
        }
      }

      // 4) Completar el profile (lo creó el trigger handle_new_user) con la info.
      const role = input.perspectiva === 'partido' ? 'emisor' : 'comprador';
      const core = {
        role,
        full_name: this.fullName(input),
        party_id: partyId,
        stellar_wallet: wallet,
        stellar_wallet_status: walletStatus ?? (wallet ? 'created' : 'failed'),
        stellar_network: walletNetwork ?? 'testnet',
        stellar_created_at: walletCreatedAt,
        stellar_wallet_error: walletError,
      };
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
        this.logger.warn('Campos de registro no existen aun (aplifá la migración). Guardo lo básico.');
        ({ error: uErr } = await db.from('profiles').update({
          role,
          full_name: this.fullName(input),
          party_id: partyId,
          stellar_wallet: wallet,
        }).eq('id', userId));
      }
      if (uErr) throw new BadRequestException(uErr.message);

      return { id: userId, email: input.email, role, perspectiva: input.perspectiva, partyId, wallet };
    } catch (e) {
      // Rollback: si algo falló luego de crear el auth user, lo borramos.
      await db.auth.admin.deleteUser(userId).catch(() => undefined);
      throw e;
    }
  }

  /* ─── Ciclo de vida de la cuenta (issue #77) ─────────────────────────────── */

  /**
   * Dispara el correo de recuperación de Supabase.
   *
   * SIEMPRE responde `{ rk: true }`, exista la cuenta o no, y nunca propaga el
   * error de Supabase: si la respuesta (o el tiempo, o el código) dependiera de
   * si el email está registrado, el endpoint se volveria un oráculo para
   * enumerar cuentas. Por eso el fallo solo se loguea.
   */
  async forgotPassword(email: string) {
    if (!email) throw new BadRequestException('email es obligatorio');

    try {
      const redirectTo = this.cfg.get<string>('AUTH_PASSWORD_RESET_REDIRECT_URL');
      await this.supabase.admin.auth.resetPasswordForEmail(
        email,
        redirectTo ? { redirectTo } : undefined,
      );
    } catch (e) {
      // Deliberadamente silencioso hacia el cliente (ver doc de arriba).
      this.logger.warn(`forgotPassword falló para ${email}: ${(e as Error).message}`);
    }

    // Se audita el intento aunque la cuenta no exista: sirve para detectar abuso.
    // No se registra si el email existía, porque eso es justo lo que no se filtra.
    await this.audit.emit({
      type: AuditEventType.AUTH_PASSWORD_RESET_REQUESTED,
      payload: { email },
    });

    return { ok: true as const };
  }

  /**
   * Completa la recuperación: canjea el `token_hash` del enlace por el usuario y
   * le fija la contraseña nueva con el service role.
   */
  async resetPassword(tokenHash: string, password: string) {
    if (!tokenHash || !password) {
      throw new BadRequestException('tokenHash y password son obligatorios');
    }

    const { data, error } = await this.supabase.admin.auth.verifyOtp({
      token_hash: tokenHash,
      type: 'recovery',
    });
    if (error || !data?.user) {
      throw new BadRequestException('El enlace de recuperación es inválido o venció');
    }

    const { error: updateError } = await this.supabase.admin.auth.admin.updateUserById(
      data.user.id,
      { password },
    );
    if (updateError) throw new BadRequestException(updateError.message);

    await this.audit.emit({
      type: AuditEventType.AUTH_PASSWORD_RESET_COMPLETED,
      actorId: data.user.id,
    });

    return { ok: true as const };
  }

  /**
   * Arranca el cambio de email. No lo aplica: genera el enlace de confirmación
   * de Supabase, así que la dirección nueva solo queda activa cuando su dueño
   * confirma. Evita que un token robado mueva la cuenta a otro correo.
   */
  async changeEmail(userId: string, currentEmail: string, newEmail: string) {
    if (!newEmail) throw new BadRequestException('email es obligatorio');
    if (newEmail === currentEmail) {
      throw new BadRequestException('El email nuevo es igual al actual');
    }

    const { error } = await this.supabase.admin.auth.admin.generateLink({
      type: 'email_change_new',
      email: currentEmail,
      newEmail,
    });
    if (error) throw new BadRequestException(error.message);

    await this.audit.emit({
      type: AuditEventType.AUTH_EMAIL_CHANGE_REQUESTED,
      actorId: userId,
      payload: { from: currentEmail, to: newEmail },
    });

    return { ok: true as const };
  }

  private fullName(i: RegisterInput): string {
    if (i.perspectiva === 'partido') return i.nombrePartido ?? i.email;
    return [i.nombres, i.apellidos].filter(Boolean).join(' ') || i.email;
  }
}
