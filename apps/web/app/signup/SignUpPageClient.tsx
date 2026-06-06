'use client';

import { useReducer } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthField } from '../../components/AuthField';
import { AuthShell } from '../../components/AuthShell';
import { MailIcon, LockIcon, UserIcon, inputClass } from '../../components/AuthUI';
import { publicApiFetch } from '../../lib/api';
import { getDefaultRouteForRole } from '../../lib/auth/routing';
import { createClient } from '../../lib/supabase/client';

type Perspectiva = 'usuario' | 'partido';

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

      return getDefaultRouteForRole(profile?.role) || (perspectiva === 'partido' ? '/partido' : '/marketplace');
    } catch {
      return perspectiva === 'partido' ? '/partido' : '/marketplace';
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
    <AuthShell>
      <div className="mx-auto w-full max-w-[560px]">
        <div className="mb-5 text-center sm:mb-6">
          <h2 className="velar-brand-text text-[1.85rem] font-extrabold tracking-[-0.03em] text-[#10235d] sm:text-[2.2rem] xl:text-[2.45rem]">
            Crear cuenta
          </h2>
          <p className="mt-1.5 text-sm leading-6 text-[#667698] sm:text-[15px]">
            Registrate para usar VELAR.
          </p>
        </div>

        <div className="mt-4 flex gap-1 rounded-[16px] border border-[#d8e2f5] bg-white/85 p-1.5 shadow-[0_8px_18px_rgba(15,35,93,0.04)]">
          {tab('usuario', 'Usuario')}
          {tab('partido', 'Partido')}
        </div>

        <form onSubmit={handleSubmit} className="velar-stagger mt-5 space-y-3.5 sm:mt-6 sm:space-y-4">
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
            <input type="email" required aria-label="Correo electronico" value={f.email ?? ''} onChange={setField('email')} placeholder="tu@correo.com" className={inputClass} />
          </AuthField>

          <AuthField label="Contrasena" icon={LockIcon}>
            <input
              type={showPass ? 'text' : 'password'}
              required
              aria-label="Contrasena"
              value={f.password ?? ''}
              onChange={setField('password')}
              placeholder="Minimo 8 caracteres"
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

          {error && <div className="rounded-[14px] bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="velar-primary-button flex h-11 w-full items-center justify-center gap-3 rounded-[14px] text-[15px] font-semibold transition disabled:opacity-60 sm:h-12 sm:text-base lg:h-[50px]"
          >
            {loading ? 'Creando...' : 'Crear cuenta'}
            {!loading && <span aria-hidden className="text-xl leading-none"> a </span>}
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
