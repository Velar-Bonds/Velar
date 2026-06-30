'use client';

import { useReducer } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye } from 'lucide-react';
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
    <AuthShell mode="login">
      <div className="mx-auto w-full">
        <form onSubmit={handleSubmit} className="space-y-5">
          <AuthField label="Correo institucional" icon={MailIcon}>
            <input
              type="email"
              required
              aria-label="Correo institucional"
              autoComplete="email"
              value={email}
              onChange={(e) => setState({ email: e.target.value })}
              placeholder="nombre@institucion.edu"
              className={inputClass}
            />
          </AuthField>

          <AuthField label="Contrasena" icon={LockIcon}>
            <input
              type={showPass ? 'text' : 'password'}
              required
              aria-label="Contrasena"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setState({ password: e.target.value })}
              placeholder="••••••••••••"
              className={`${inputClass} pr-11`}
            />
            <button
              type="button"
              onClick={() => setState({ showPass: !showPass })}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8b96ad] transition hover:text-[#5f709b]"
              aria-label="Mostrar contrasena"
            >
              <Eye size={20} strokeWidth={1.9} aria-hidden />
            </button>
          </AuthField>

          <div className="flex items-center justify-between gap-3 pt-1 text-[13px] sm:text-sm">
            <label className="flex items-center gap-2 text-[#667698]">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setState({ remember: e.target.checked })}
                className="h-4 w-4 rounded border-[#b7c8eb] accent-[#1f63ff] sm:h-5 sm:w-5"
              />
              Recordarme
            </label>
            <button type="button" className="shrink-0 text-right font-medium text-[#1f63ff] hover:underline">
              Olvidaste tu contrasena?
            </button>
          </div>

          {error && <div className="rounded-[14px] bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="velar-primary-button flex h-13 w-full items-center justify-center gap-3 rounded-[8px] text-[16px] font-semibold transition disabled:opacity-60"
          >
            {loading ? 'Iniciando...' : 'Iniciar sesion'}
          </button>
        </form>

        <AuthDivider text="o continua con" />
        <SocialButtons />

        <p className="mt-5 text-center text-sm text-[#667698] sm:hidden">
          No tienes cuenta?{' '}
          <Link href="/signup" className="font-semibold text-[#1f63ff] hover:underline">
            Crear cuenta
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
