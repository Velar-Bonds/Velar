'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';
import { AuthBranding } from '../../components/AuthBranding';
import { SocialButtons, Divider, Field, MailIcon, LockIcon, inputClass } from '../../components/AuthUI';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { error: loginErr } = await supabase.auth.signInWithPassword({ email, password });
      if (loginErr) throw loginErr;
      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message ?? 'No se pudo iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#E9F0FF] via-[#F2F5FF] to-white">
      <div className="mx-auto grid min-h-screen max-w-[1400px] grid-cols-1 lg:grid-cols-2">
        <AuthBranding />

        <div className="flex items-center justify-center p-6 lg:p-10">
          <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-8 shadow-[0_20px_60px_-20px_rgba(37,99,235,0.25)] sm:p-10">
            <h2 className="text-center text-3xl font-extrabold text-[#1E293B]">Iniciar sesión</h2>
            <p className="mt-1.5 text-center text-sm text-slate-500">Accede a tu cuenta para continuar.</p>

            <p className="mt-7 mb-3 text-sm font-medium text-[#1E293B]">Continuar con</p>
            <SocialButtons />
            <Divider text="O continúa con correo" />

            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label="Correo electrónico" icon={MailIcon}>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com" className={inputClass} />
              </Field>

              <Field label="Contraseña" icon={LockIcon}>
                <input type={showPass ? 'text' : 'password'} required value={password}
                  onChange={(e) => setPassword(e.target.value)} placeholder="Ingresa tu contraseña"
                  className={inputClass + ' pr-11'} />
                <button type="button" onClick={() => setShowPass((s) => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" aria-label="Mostrar contraseña">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>
                </button>
              </Field>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-slate-600">
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-[#2563EB] accent-[#2563EB]" />
                  Recordarme
                </label>
                <a href="#" className="font-medium text-[#2563EB] hover:underline">¿Olvidaste tu contraseña?</a>
              </div>

              {error && <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

              <button type="submit" disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] py-3.5 text-sm font-semibold text-white transition hover:bg-[#1d4ed8] disabled:opacity-60">
                {loading ? 'Iniciando…' : 'Iniciar sesión'}
                {!loading && <span aria-hidden>→</span>}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-600">
              ¿No tienes cuenta?{' '}
              <Link href="/signup" className="font-semibold text-[#2563EB] hover:underline">Crear cuenta</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
