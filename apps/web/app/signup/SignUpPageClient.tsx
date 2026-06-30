'use client';

import { useReducer } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye } from 'lucide-react';
import { AuthField } from '../../components/AuthField';
import { AuthShell } from '../../components/AuthShell';
import { MailIcon, LockIcon, UserIcon, inputClass } from '../../components/AuthUI';
import { publicApiFetch } from '../../lib/api';
import { getDefaultRouteForRole } from '../../lib/auth/routing';
import { createClient } from '../../lib/supabase/client';

type Perspectiva = 'usuario' | 'partido' | 'tse';

type SignUpState = {
  perspectiva: Perspectiva;
  f: Record<string, string>;
  showPass: boolean;
  error: string;
  loading: boolean;
};

const initialSignUpState: SignUpState = {
  perspectiva: 'usuario',
  f: {},
  showPass: false,
  error: '',
  loading: false,
};

function signUpReducer(state: SignUpState, patch: Partial<SignUpState>) {
  return { ...state, ...patch };
}

const defaultRoute = (p: Perspectiva) =>
  p === 'partido' ? '/partido' : p === 'tse' ? '/tse' : '/marketplace';

export default function SignUpPage() {
  const [state, setState] = useReducer(signUpReducer, initialSignUpState);
  const { perspectiva, f, showPass, error, loading } = state;
  const router = useRouter();
  const supabase = createClient();

  const setField = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setState({ f: { ...f, [key]: e.target.value } });

  async function resolveDestination() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return perspectiva === 'partido' ? '/partido' : '/marketplace';

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      return getDefaultRouteForRole(profile?.role) || defaultRoute(perspectiva);
    } catch {
      return defaultRoute(perspectiva);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState({ loading: true, error: '' });

    try {
      await publicApiFetch('POST', '/auth/register', { ...f, perspectiva });

      const { error: loginErr } = await supabase.auth.signInWithPassword({
        email: f.email,
        password: f.password,
      });
      if (loginErr) throw loginErr;

      const destination = await resolveDestination();
      router.replace(destination);
      router.refresh();
    } catch (err: any) {
      setState({ error: err.message ?? 'Error al registrarse' });
    } finally {
      setState({ loading: false });
    }
  }

  const tab = (value: Perspectiva, label: string) => (
    <button
      type="button"
      onClick={() => setState({ perspectiva: value })}
      className={`flex-1 rounded-[12px] py-2.5 text-sm font-semibold transition sm:py-3 ${
        perspectiva === value
          ? 'bg-[#1f63ff] text-white shadow-[0_10px_22px_rgba(31,99,255,0.18)]'
          : 'text-[#667698] hover:bg-[#f4f8ff]'
      }`}
    >
      {label}
    </button>
  );

  return (
    <AuthShell mode="signup">
      <div className="mx-auto w-full max-w-[560px]">
        <div className="mt-5 flex gap-1 rounded-[10px] border border-[#d8e2f5] bg-white p-1">
          {tab('usuario', 'Usuario')}
          {tab('partido', 'Partido')}
          {tab('tse', 'TSE')}
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3.5 sm:mt-6 sm:space-y-4">
          {perspectiva === 'usuario' ? (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <AuthField label="Nombres" icon={UserIcon}>
                  <input required aria-label="Nombres" value={f.nombres ?? ''} onChange={setField('nombres')} placeholder="Maria" className={inputClass} />
                </AuthField>
                <AuthField label="Apellidos" icon={UserIcon}>
                  <input required aria-label="Apellidos" value={f.apellidos ?? ''} onChange={setField('apellidos')} placeholder="Gomez" className={inputClass} />
                </AuthField>
              </div>
              <AuthField label="Identificacion" icon={UserIcon}>
                <input required aria-label="Identificacion" value={f.identificacion ?? ''} onChange={setField('identificacion')} placeholder="1-2345-6789" className={inputClass} />
              </AuthField>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <AuthField label="Telefono" icon={UserIcon}>
                  <input aria-label="Telefono" value={f.telefono ?? ''} onChange={setField('telefono')} placeholder="8888-0000" className={inputClass} />
                </AuthField>
                <AuthField label="Direccion" icon={UserIcon}>
                  <input aria-label="Direccion" value={f.direccion ?? ''} onChange={setField('direccion')} placeholder="San Jose" className={inputClass} />
                </AuthField>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <AuthField label="Nombre del partido" icon={UserIcon}>
                  <input required aria-label="Nombre del partido" value={f.nombrePartido ?? ''} onChange={setField('nombrePartido')} placeholder="Partido X" className={inputClass} />
                </AuthField>
                <AuthField label="Codigo" icon={UserIcon}>
                  <input required aria-label="Codigo" value={f.codigo ?? ''} onChange={setField('codigo')} placeholder="PX" className={inputClass} />
                </AuthField>
              </div>
              <AuthField label="Representante legal" icon={UserIcon}>
                <input aria-label="Representante legal" value={f.representanteLegal ?? ''} onChange={setField('representanteLegal')} placeholder="Juan Perez" className={inputClass} />
              </AuthField>
              <AuthField label="Cedula juridica" icon={UserIcon}>
                <input aria-label="Cedula juridica" value={f.cedulaJuridica ?? ''} onChange={setField('cedulaJuridica')} placeholder="3-101-123456" className={inputClass} />
              </AuthField>
            </>
          )}

          <AuthField label="Correo electronico" icon={MailIcon}>
            <input type="email" required aria-label="Correo electronico" autoComplete="email" value={f.email ?? ''} onChange={setField('email')} placeholder="tu@correo.com" className={inputClass} />
          </AuthField>

          <AuthField label="Contrasena" icon={LockIcon}>
            <input
              type={showPass ? 'text' : 'password'}
              required
              aria-label="Contrasena"
              autoComplete="new-password"
              value={f.password ?? ''}
              onChange={setField('password')}
              placeholder="Minimo 8 caracteres"
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

          {error && <div className="rounded-[14px] bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="velar-primary-button flex h-13 w-full items-center justify-center gap-3 rounded-[8px] text-[16px] font-semibold transition disabled:opacity-60"
          >
            {loading ? 'Creando...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-[#667698] sm:mt-6">
          Ya tienes cuenta?{' '}
          <Link href="/login" className="font-semibold text-[#1f63ff] hover:underline">
            Iniciar sesion
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
