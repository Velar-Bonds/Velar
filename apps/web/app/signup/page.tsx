'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';
import { AuthBranding } from '../../components/AuthBranding';
import { Field, MailIcon, LockIcon, UserIcon, inputClass } from '../../components/AuthUI';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
type Perspectiva = 'usuario' | 'partido';

export default function SignUpPage() {
  const [perspectiva, setPerspectiva] = useState<Perspectiva>('usuario');
  const [f, setF] = useState<Record<string, string>>({});
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setF((p) => ({ ...p, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...f, perspectiva }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'No se pudo crear la cuenta');
      // Iniciar sesión automáticamente.
      const { error: loginErr } = await supabase.auth.signInWithPassword({ email: f.email, password: f.password });
      if (loginErr) throw loginErr;
      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message ?? 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  }

  const tab = (p: Perspectiva, label: string) => (
    <button type="button" onClick={() => setPerspectiva(p)}
      className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${perspectiva === p ? 'bg-[#2563EB] text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
      {label}
    </button>
  );

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#E9F0FF] via-[#F2F5FF] to-white">
      <div className="mx-auto grid min-h-screen max-w-[1400px] grid-cols-1 lg:grid-cols-2">
        <AuthBranding />

        <div className="flex items-center justify-center p-6 lg:p-10">
          <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-8 shadow-[0_20px_60px_-20px_rgba(37,99,235,0.25)] sm:p-10">
            <h2 className="text-center text-3xl font-extrabold text-[#1E293B]">Crear cuenta</h2>
            <p className="mt-1.5 text-center text-sm text-slate-500">Registrate para usar VELAR.</p>

            <div className="mt-6 flex gap-1 rounded-xl border border-slate-200 p-1">
              {tab('usuario', '👤 Usuario')}
              {tab('partido', '🎗️ Partido')}
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {perspectiva === 'usuario' ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Nombres" icon={UserIcon}>
                      <input required value={f.nombres ?? ''} onChange={set('nombres')} placeholder="María" className={inputClass} />
                    </Field>
                    <Field label="Apellidos" icon={UserIcon}>
                      <input required value={f.apellidos ?? ''} onChange={set('apellidos')} placeholder="Gómez" className={inputClass} />
                    </Field>
                  </div>
                  <Field label="Identificación" icon={UserIcon}>
                    <input required value={f.identificacion ?? ''} onChange={set('identificacion')} placeholder="1-2345-6789" className={inputClass} />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Teléfono" icon={UserIcon}>
                      <input value={f.telefono ?? ''} onChange={set('telefono')} placeholder="8888-0000" className={inputClass} />
                    </Field>
                    <Field label="Dirección" icon={UserIcon}>
                      <input value={f.direccion ?? ''} onChange={set('direccion')} placeholder="San José" className={inputClass} />
                    </Field>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Nombre del partido" icon={UserIcon}>
                      <input required value={f.nombrePartido ?? ''} onChange={set('nombrePartido')} placeholder="Partido X" className={inputClass} />
                    </Field>
                    <Field label="Código" icon={UserIcon}>
                      <input required value={f.codigo ?? ''} onChange={set('codigo')} placeholder="PX" className={inputClass} />
                    </Field>
                  </div>
                  <Field label="Representante legal" icon={UserIcon}>
                    <input value={f.representanteLegal ?? ''} onChange={set('representanteLegal')} placeholder="Juan Pérez" className={inputClass} />
                  </Field>
                  <Field label="Cédula jurídica" icon={UserIcon}>
                    <input value={f.cedulaJuridica ?? ''} onChange={set('cedulaJuridica')} placeholder="3-101-123456" className={inputClass} />
                  </Field>
                </>
              )}

              <Field label="Correo electrónico" icon={MailIcon}>
                <input type="email" required value={f.email ?? ''} onChange={set('email')} placeholder="tu@correo.com" className={inputClass} />
              </Field>

              <Field label="Contraseña" icon={LockIcon}>
                <input type={showPass ? 'text' : 'password'} required value={f.password ?? ''} onChange={set('password')}
                  placeholder="Mínimo 8 caracteres" className={inputClass + ' pr-11'} />
                <button type="button" onClick={() => setShowPass((s) => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" aria-label="Mostrar contraseña">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>
                </button>
              </Field>

              {error && <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

              <button type="submit" disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] py-3.5 text-sm font-semibold text-white transition hover:bg-[#1d4ed8] disabled:opacity-60">
                {loading ? 'Creando…' : 'Crear cuenta'}
                {!loading && <span aria-hidden>→</span>}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-600">
              ¿Ya tienes cuenta?{' '}
              <Link href="/login" className="font-semibold text-[#2563EB] hover:underline">Iniciar sesión</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
