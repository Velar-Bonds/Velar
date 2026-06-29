'use client';
/**
 * Búsqueda pública de trazabilidad. Cualquiera pega el ID de un bono y verifica
 * su historial on-chain — sin cuenta. Es la puerta de entrada ciudadana a VELAR.
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Boxes, Search, ShieldCheck } from 'lucide-react';

export default function VerificarPage() {
  const router = useRouter();
  const [value, setValue] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = value.trim();
    if (v) router.push(`/verificar/${encodeURIComponent(v)}`);
  };

  return (
    <div className="min-h-screen bg-[#fafcff] text-on-surface" style={{ fontFamily: 'Inter, sans-serif' }}>
      <header className="border-b border-outline-variant/20 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[920px] items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-container text-white"><Boxes size={18} /></span>
            <span className="text-lg font-bold tracking-tight" style={{ fontFamily: 'Geist' }}>VELAR</span>
          </Link>
          <span className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            <ShieldCheck size={13} /> Verificación pública
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-[640px] px-5 py-16">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl" style={{ fontFamily: 'Geist' }}>
          Verificá un bono político
        </h1>
        <p className="mt-3 text-on-surface-variant">
          Pegá el identificador de un bono y consultá su historial completo en la blockchain de Stellar:
          quién lo emitió, cada cambio de dueño y todas las transacciones — público, inmutable y sin necesidad de cuenta.
        </p>

        <form onSubmit={submit} className="mt-7 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
            <input
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Ej: SOL-2026-114"
              aria-label="Identificador del bono"
              className="w-full rounded-xl border border-outline-variant/40 bg-white py-3 pl-10 pr-3 text-sm outline-none transition focus:border-primary-container focus:ring-1 focus:ring-primary-container"
            />
          </div>
          <button type="submit" className="btn-action btn-lg flex items-center justify-center gap-2 rounded-xl px-5">
            <Search size={16} /> Verificar
          </button>
        </form>

        <p className="mt-4 text-xs text-on-surface-variant">
          Aceptamos el número del bono (p. ej. <span className="font-mono">SOL-2026-114</span>) o el identificador del token.
        </p>
      </main>
    </div>
  );
}
