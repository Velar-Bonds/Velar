'use client';

import { useReducer } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthBranding } from '../../components/AuthBranding';
import { Field } from '../../components/AuthField';
import { MailIcon, LockIcon, UserIcon, inputClass } from '../../components/AuthUI';
import { getDefaultRouteForRole } from '../../lib/auth/routing';
import { createClient } from '../../lib/supabase/client';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

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
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...f, perspectiva }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'No se pudo crear la cuenta');

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
      className={`flex-1 rounded-[12px] py-3 text-sm font-semibold transition ${
        perspectiva === value
          ? 'bg-[#1f63ff] text-white shadow-[0_10px_22px_rgba(31,99,255,0.18)]'
          : 'text-[#667698] hover:bg-[#f4f8ff]'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="velar-auth-shell min-h-screen w-full p-3 sm:p-4">
      <div className="mx-auto flex min-h-[calc(100vh-1.5rem)] max-w-[1500px] flex-col gap-4 lg:flex-row">
        <AuthBranding />

        <section className="flex w-full items-center justify-center px-4 py-10 lg:w-[45%] lg:px-8 xl:px-12">
          <div className="velar-auth-card w-full max-w-[680px] rounded-[26px] p-8 sm:p-10 lg:p-12">
            <div className="mx-auto max-w-[560px]">
              <div className="mb-8 text-center">
                <h2 className="velar-brand-text text-4xl font-extrabold tracking-[-0.03em] text-[#10235d]">Crear cuenta</h2>
                <p className="mt-2 text-base text-[#667698]">Registrate para usar VELAR.</p>
              </div>

              <div className="mt-6 flex gap-1 rounded-[16px] border border-[#d8e2f5] bg-white/80 p-1.5">
                {tab('usuario', 'Usuario')}
                {tab('partido', 'Partido')}
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {perspectiva === 'usuario' ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Nombres" icon={UserIcon}>
                        <input required aria-label="Nombres" value={f.nombres ?? ''} onChange={setField('nombres')} placeholder="Maria" className={inputClass} />
                      </Field>
                      <Field label="Apellidos" icon={UserIcon}>
                        <input required aria-label="Apellidos" value={f.apellidos ?? ''} onChange={setField('apellidos')} placeholder="Gomez" className={inputClass} />
                      </Field>
                    </div>
                    <Field label="Identificacion" icon={UserIcon}>
                      <input required aria-label="Identificacion" value={f.identificacion ?? ''} onChange={setField('identificacion')} placeholder="1-2345-6789" className={inputClass} />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Telefono" icon={UserIcon}>
                        <input aria-label="Telefono" value={f.telefono ?? ''} onChange={setField('telefono')} placeholder="8888-0000" className={inputClass} />
                      </Field>
                      <Field label="Direccion" icon={UserIcon}>
                        <input aria-label="Direccion" value={f.direccion ?? ''} onChange={setField('direccion')} placeholder="San Jose" className={inputClass} />
                      </Field>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Nombre del partido" icon={UserIcon}>
                        <input required aria-label="Nombre del partido" value={f.nombrePartido ?? ''} onChange={setField('nombrePartido')} placeholder="Partido X" className={inputClass} />
                      </Field>
                      <Field label="Codigo" icon={UserIcon}>
                        <input required aria-label="Codigo" value={f.codigo ?? ''} onChange={setField('codigo')} placeholder="PX" className={inputClass} />
                      </Field>
                    </div>
                    <Field label="Representante legal" icon={UserIcon}>
                      <input aria-label="Representante legal" value={f.representanteLegal ?? ''} onChange={setField('representanteLegal')} placeholder="Juan Perez" className={inputClass} />
                    </Field>
                    <Field label="Cedula juridica" icon={UserIcon}>
                      <input aria-label="Cedula juridica" value={f.cedulaJuridica ?? ''} onChange={setField('cedulaJuridica')} placeholder="3-101-123456" className={inputClass} />
                    </Field>
                  </>
                )}

                <Field label="Correo electronico" icon={MailIcon}>
                  <input type="email" required aria-label="Correo electronico" value={f.email ?? ''} onChange={setField('email')} placeholder="tu@correo.com" className={inputClass} />
                </Field>

                <Field label="Contrasena" icon={LockIcon}>
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
                </Field>

                {error && <div className="rounded-[14px] bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

                <button
                  type="submit"
                  disabled={loading}
                  className="velar-primary-button flex h-14 w-full items-center justify-center gap-3 rounded-[14px] text-base font-semibold transition disabled:opacity-60"
                >
                  {loading ? 'Creando...' : 'Crear cuenta'}
                  {!loading && <span aria-hidden className="text-xl leading-none">→</span>}
                </button>
              </form>

              <p className="mt-8 text-center text-sm text-[#667698]">
                Ya tienes cuenta?{' '}
                <Link href="/login" className="font-semibold text-[#1f63ff] hover:underline">
                  Iniciar sesion
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
