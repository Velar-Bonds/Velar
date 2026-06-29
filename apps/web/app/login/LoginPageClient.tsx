'use client';

import { useReducer } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthDivider } from '../../components/AuthDivider';
import { AuthField } from '../../components/AuthField';
import { AuthShell } from '../../components/AuthShell';
import { SocialButtons, MailIcon, LockIcon, inputClass } from '../../components/AuthUI';
import { getDefaultRouteForRole, getSafeRedirectTarget } from '../../lib/auth/routing';
import { createClient } from '../../lib/supabase/client';

type LoginState = {
  email: string;
  password: string;
  showPass: boolean;
  remember: boolean;
  error: string;
  loading: boolean;
};

const initialLoginState: LoginState = {
  email: '',
  password: '',
  showPass: false,
  remember: false,
  error: '',
  loading: false,
};

function loginReducer(state: LoginState, patch: Partial<LoginState>) {
  return { ...state, ...patch };
}

const socialAuthEnabled = process.env.NEXT_PUBLIC_SOCIAL_AUTH === '1';

export default function LoginPage() {
  const [state, setState] = useReducer(loginReducer, initialLoginState);
  const { email, password, showPass, remember, error, loading } = state;
  const router = useRouter();
  const supabase = createClient();

  async function resolveDestination() {
    const requestedTarget = getSafeRedirectTarget(
      typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('next'),
    );
    if (requestedTarget) return requestedTarget;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return '/';

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      return getDefaultRouteForRole(profile?.role);
    } catch {
      return '/';
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState({ loading: true, error: '' });

    try {
      const { error: loginErr } = await supabase.auth.signInWithPassword({ email, password });
      if (loginErr) throw loginErr;

      const destination = await resolveDestination();
      router.replace(destination);
      router.refresh();
    } catch (err: any) {
      setState({ error: err.message ?? 'No se pudo iniciar sesion' });
    } finally {
      setState({ loading: false });
    }
  }

  return (
    <AuthShell cardClassName="lg:h-full">
      <div className="mx-auto w-full max-w-[560px] lg:flex lg:min-h-0 lg:flex-1 lg:flex-col lg:justify-center">
        <div className="mb-5 text-center sm:mb-6 lg:mb-6">
          <h2 className="velar-brand-text text-[1.85rem] font-extrabold tracking-[-0.03em] text-[#10235d] sm:text-[2.2rem] xl:text-[2.45rem]">
            Iniciar sesion
          </h2>
          <p className="mt-1.5 text-sm leading-6 text-[#667698] sm:text-[15px]">
            Accede a tu cuenta para continuar.
          </p>
        </div>

        {socialAuthEnabled && (
          <>
            <div className="velar-fade-in">
              <p className="mb-2.5 text-sm font-medium text-[#10235d]">Continuar con</p>
              <SocialButtons />
            </div>
            <AuthDivider text="O continua con correo" />
          </>
        )}

        <form onSubmit={handleSubmit} className="velar-stagger space-y-3.5 sm:space-y-4">
          <AuthField label="Correo electronico" icon={MailIcon}>
            <input
              type="email"
              required
              aria-label="Correo electronico"
              value={email}
              onChange={(e) => setState({ email: e.target.value })}
              placeholder="tu@correo.com"
              className={inputClass}
            />
          </AuthField>

          <AuthField label="Contrasena" icon={LockIcon}>
            <input
              type={showPass ? 'text' : 'password'}
              required
              aria-label="Contrasena"
              value={password}
              onChange={(e) => setState({ password: e.target.value })}
              placeholder="Ingresa tu contrasena"
              className={`${inputClass} pr-11`}
            />
            <button
              type="button"
              onClick={() => setState({ showPass: !showPass })}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8b9ac0] transition hover:text-[#5f709b]"
              aria-label="Mostrar contrasena"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
          </AuthField>

          <div className="flex flex-col gap-2.5 pt-1 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <label className="flex items-center gap-2 text-[#667698]">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setState({ remember: e.target.checked })}
                className="h-4 w-4 rounded border-[#b7c8eb] accent-[#1f63ff] sm:h-5 sm:w-5"
              />
              Recordarme
            </label>
            <button type="button" className="text-left font-medium text-[#1f63ff] hover:underline sm:text-right">
              Olvidaste tu contrasena?
            </button>
          </div>

          {error && <div className="rounded-[14px] bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="velar-primary-button flex h-11 w-full items-center justify-center gap-3 rounded-[14px] text-[15px] font-semibold transition disabled:opacity-60 sm:h-12 sm:text-base lg:h-[50px]"
          >
            {loading ? 'Iniciando...' : 'Iniciar sesion'}
            
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-[#667698] sm:mt-6">
          No tienes cuenta?{' '}
          <Link href="/signup" className="font-semibold text-[#1f63ff] hover:underline">
            Crear cuenta
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
