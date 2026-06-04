'use client';

import { useReducer } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthBranding } from '../../components/AuthBranding';
import { Divider } from '../../components/AuthDivider';
import { Field } from '../../components/AuthField';
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
    <div className="velar-auth-shell h-[100dvh] w-full overflow-hidden px-3 py-2 sm:px-4 sm:py-3">
      <div className="mx-auto flex h-full max-w-[1500px] flex-col gap-3 lg:flex-row">
        <AuthBranding />

        <section className="flex h-full w-full items-center justify-center px-3 py-3 lg:w-[45%] lg:px-6 xl:px-10">
          <div className="velar-auth-card flex h-full w-full max-w-[680px] rounded-[24px] p-6 sm:p-8 lg:max-h-full lg:p-9">
            <div className="mx-auto flex h-full w-full max-w-[540px] flex-col justify-center">
              <div className="mb-6 text-center lg:mb-7">
                <h2 className="velar-brand-text text-[2rem] font-extrabold tracking-[-0.03em] text-[#10235d] sm:text-4xl">Iniciar sesion</h2>
                <p className="mt-1.5 text-sm text-[#667698] sm:text-[15px]">Accede a tu cuenta para continuar.</p>
              </div>

              <p className="mb-2.5 text-sm font-medium text-[#10235d]">Continuar con</p>
              <SocialButtons />
              <Divider text="O continua con correo" />

              <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-4.5">
                <Field label="Correo electronico" icon={MailIcon}>
                  <input
                    type="email"
                    required
                    aria-label="Correo electronico"
                    value={email}
                    onChange={(e) => setState({ email: e.target.value })}
                    placeholder="tu@correo.com"
                    className={inputClass}
                  />
                </Field>

                <Field label="Contrasena" icon={LockIcon}>
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
                </Field>

                <div className="flex items-center justify-between gap-4 text-sm">
                  <label className="flex items-center gap-2 text-[#667698]">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setState({ remember: e.target.checked })}
                      className="h-5 w-5 rounded border-[#b7c8eb] accent-[#1f63ff]"
                    />
                    Recordarme
                  </label>
                  <button type="button" className="font-medium text-[#1f63ff] hover:underline">
                    Olvidaste tu contrasena?
                  </button>
                </div>

                {error && <div className="rounded-[14px] bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

                <button
                  type="submit"
                  disabled={loading}
                  className="velar-primary-button flex h-13 w-full items-center justify-center gap-3 rounded-[14px] text-[15px] font-semibold transition disabled:opacity-60 sm:h-14 sm:text-base"
                >
                  {loading ? 'Iniciando...' : 'Iniciar sesion'}
                  {!loading && <span aria-hidden className="text-xl leading-none">→</span>}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-[#667698] lg:mt-7">
                No tienes cuenta?{' '}
                <Link href="/signup" className="font-semibold text-[#1f63ff] hover:underline">
                  Crear cuenta
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
