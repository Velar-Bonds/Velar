import Link from 'next/link';
import type { Metadata } from 'next';
import {
  ArrowRight,
  ShieldCheck,
  Landmark,
  Eye,
  CheckCircle2,
  Boxes,
  Activity,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'VELAR · Trazabilidad pública de bonos políticos',
  description: 'Plataforma de coordinación on-chain para emitir, custodiar y auditar bonos políticos en Stellar testnet. Cada movimiento es verificable por cualquier persona.',
};

const HOW_IT_WORKS = [
  { n: '1', title: 'El partido solicita', body: 'Llena el certificado: monto, serie, vencimiento, tasa. Queda pendiente de revisión.', actor: 'Partido emisor' },
  { n: '2', title: 'El TSE revisa', body: 'Valida el respaldo legal y aprueba o rechaza con motivo. Solo el TSE puede emitir.', actor: 'Tribunal Supremo de Elecciones' },
  { n: '3', title: 'Bono on-chain', body: 'Stellar emite el token único del bono y lo asigna a la wallet de custodia del partido.', actor: 'Stellar Testnet' },
  { n: '4', title: 'Negocio público', body: 'Compras, reventas y precios quedan registrados en cadena con un contrato de coordinación.', actor: 'Marketplace + Trustless Work' },
];

const STAKEHOLDERS = [
  {
    role: 'Para el partido',
    Icon: Landmark,
    color: 'text-primary',
    headline: 'Financiá la campaña con respaldo verificable.',
    bullets: [
      'Solicitá bonos al TSE y seguí el estado en vivo',
      'Publicá en el marketplace cuando estén aprobados',
      'Cada movimiento queda firmado en tu wallet de custodia',
    ],
  },
  {
    role: 'Para el TSE',
    Icon: ShieldCheck,
    color: 'text-emerald-700',
    headline: 'Supervisá el sistema completo sin recibir papeles.',
    bullets: [
      'Aprobá o rechazá solicitudes con motivo registrado',
      'Visualizá análisis por partido, montos y reventas',
      'Resolvé disputas retirando el bono del escrow',
    ],
  },
  {
    role: 'Para la ciudadanía',
    Icon: Eye,
    color: 'text-slate-700',
    headline: 'Verificá quién financia qué, sin pedir permiso.',
    bullets: [
      'Consultá la trazabilidad de cualquier bono',
      'Abrí cualquier transacción en Stellar Expert',
      'El historial es público y no se puede alterar',
    ],
  },
];

const TRACE_EVENTS = [
  { t: 'Aprobado por TSE', detail: 'Solicitud CERT-2026-014 → bono SOL-2026-018', hash: '0xa39…d2c1', when: 'hace 2 horas' },
  { t: 'Emitido on-chain', detail: 'Token único asignado a Partido Aurora', hash: '0xf21…8c3a', when: 'hace 2 horas' },
  { t: 'Publicado al mercado', detail: 'Precio inicial ₡5 000 000', hash: 'sin tx', when: 'hace 1 hora' },
  { t: 'Comprado', detail: 'Partido Aurora → Juan Pérez · ₡4 800 000', hash: '0xb7d…1f5c', when: 'hace 38 min' },
];

function StellarMark({ className = 'h-5 w-auto' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <path
        fill="currentColor"
        d="M58 12.5 49.4 17 18.2 32.5 11.9 35.7 6 32.5l13.4-6.7L43.2 14.1l5.8-2.9L54 8.3l4 4.2zM6 19.5l4 4.1 8.6-4.3 13.1 6.6 17.7 8.9 4.7-2.4-19.8-10-22.4 11.3L6 25.7zm0 25 18.8 9.5 22.4-11.3 11-5.5-4-4.2-8.6 4.3-13.1-6.6L18.7 22.7l-4.7 2.4 19.8 10z"
      />
    </svg>
  );
}

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900" style={{ fontFamily: 'Inter, sans-serif' }}>
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <svg width="22" height="22" viewBox="0 0 44 44" fill="none">
              <path d="M9 10 L22 33 L35 10" stroke="#0047C1" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-lg font-semibold tracking-tight" style={{ fontFamily: 'Geist, sans-serif' }}>VELAR</span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-slate-600 md:flex">
            <a href="#como-funciona" className="hover:text-slate-900">Cómo funciona</a>
            <a href="#trazabilidad" className="hover:text-slate-900">Trazabilidad</a>
            <a href="#actores" className="hover:text-slate-900">Para quién</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden text-sm font-medium text-slate-600 hover:text-slate-900 sm:inline">Iniciar sesión</Link>
            <Link href="/signup" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800">
              Crear cuenta <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-slate-200/60">
        <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-12 px-6 pb-16 pt-16 lg:grid-cols-12 lg:gap-16 lg:pt-20">
          <div className="lg:col-span-7">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[12px] font-medium text-slate-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Coordinación on-chain en Stellar testnet
            </p>
            <h1 className="text-balance text-4xl font-bold leading-[1.05] tracking-tight text-slate-900 md:text-5xl lg:text-[64px] lg:leading-[1.02]" style={{ fontFamily: 'Geist, sans-serif' }}>
              Bonos políticos<br />que se pueden<br /><span className="text-primary">auditar al instante.</span>
            </h1>
            <p className="mt-6 max-w-[58ch] text-lg leading-relaxed text-slate-600">
              VELAR coordina la emisión, custodia y reventa de bonos políticos con un registro
              público inmutable. Lo que antes era un PDF en una caja, ahora es verificable en cadena.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/signup" className="inline-flex h-12 items-center gap-2 rounded-full bg-slate-900 px-6 text-[15px] font-semibold text-white transition hover:bg-slate-800 hover:shadow-lg">
                Crear cuenta <ArrowRight size={16} />
              </Link>
              <Link href="#trazabilidad" className="inline-flex h-12 items-center gap-2 rounded-full border border-slate-300 bg-white px-6 text-[15px] font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50">
                Ver trazabilidad pública
              </Link>
            </div>
          </div>

          <div className="relative lg:col-span-5">
            <div className="relative rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 shadow-[0_18px_60px_-15px_rgba(15,23,42,0.18)]">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Bono on-chain</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Confirmado
                </span>
              </div>
              <p className="font-mono text-2xl font-bold text-primary" style={{ fontFamily: 'JetBrains Mono, monospace' }}>SOL-2026-018</p>
              <p className="mt-1 text-sm text-slate-500">Emitido a Partido Aurora · Serie A</p>

              <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-200 pt-5 text-sm">
                <div><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Monto</p><p className="mt-0.5 font-semibold">₡5 000 000</p></div>
                <div><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Vencimiento</p><p className="mt-0.5 font-semibold">15 ene 2027</p></div>
                <div><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Tasa</p><p className="mt-0.5 font-semibold">6.5%</p></div>
                <div><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Dueño actual</p><p className="mt-0.5 font-semibold">Juan Pérez</p></div>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-4">
                <p className="font-mono text-[11px] text-slate-500">0xa39c1d2…7e021f</p>
                <span className="inline-flex items-center gap-1 text-[12px] font-medium text-primary">Stellar Expert <ExternalLink size={11} /></span>
              </div>
            </div>

            <div className="absolute -bottom-6 -left-6 hidden w-56 rounded-xl border border-slate-200 bg-white p-4 shadow-lg lg:block">
              <div className="mb-2 flex items-center gap-2">
                <Activity size={14} className="text-emerald-600" />
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Última venta</span>
              </div>
              <p className="font-mono text-sm font-bold">₡4 800 000</p>
              <p className="text-[11px] text-slate-500">Aurora → Juan Pérez · hace 38 min</p>
            </div>
          </div>
        </div>
      </section>

      {/* ALIADOS */}
      <section className="border-b border-slate-200/60 bg-slate-50/50 py-10">
        <div className="mx-auto max-w-[1280px] px-6">
          <p className="mb-6 text-center text-[12px] font-medium uppercase tracking-wide text-slate-500">
            Construido sobre infraestructura pública
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-70 grayscale">
            <div className="flex items-center gap-2 text-slate-700"><StellarMark className="h-6 w-auto" /><span className="text-sm font-semibold">Stellar Testnet</span></div>
            <div className="flex items-center gap-2 text-slate-700"><ShieldCheck size={20} /><span className="text-sm font-semibold">Trustless Work</span></div>
            <div className="flex items-center gap-2 text-slate-700"><Landmark size={20} /><span className="text-sm font-semibold">Tribunal Supremo</span></div>
            <div className="flex items-center gap-2 text-slate-700"><Boxes size={20} /><span className="text-sm font-semibold">Soroban Smart Contracts</span></div>
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="como-funciona" className="border-b border-slate-200/60 py-24">
        <div className="mx-auto max-w-[1280px] px-6">
          <div className="mb-14 max-w-2xl">
            <h2 className="text-3xl font-bold leading-tight tracking-tight md:text-4xl" style={{ fontFamily: 'Geist, sans-serif' }}>
              De la solicitud al ledger,<br />en cuatro pasos verificables.
            </h2>
            <p className="mt-4 text-slate-600">Ningún actor puede saltarse pasos. Cada estado queda registrado y firmado.</p>
          </div>

          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 md:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.n} className="bg-white p-7">
                <div className="mb-5 flex items-center justify-between">
                  <span className="font-mono text-2xl font-bold text-primary" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{step.n}</span>
                  <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{step.actor}</span>
                </div>
                <h3 className="mb-2 text-lg font-semibold leading-snug" style={{ fontFamily: 'Geist, sans-serif' }}>{step.title}</h3>
                <p className="text-sm leading-relaxed text-slate-600">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRAZABILIDAD */}
      <section id="trazabilidad" className="border-b border-slate-200/60 bg-gradient-to-b from-slate-50/60 to-white py-24">
        <div className="mx-auto max-w-[1280px] px-6">
          <div className="grid grid-cols-1 gap-14 lg:grid-cols-5 lg:gap-20">
            <div className="lg:col-span-3">
              <h2 className="mb-4 text-3xl font-bold leading-tight tracking-tight md:text-4xl" style={{ fontFamily: 'Geist, sans-serif' }}>
                Cada bono cuenta<br />su propia historia.
              </h2>
              <p className="mb-8 max-w-md text-slate-600">
                Así se ve el historial de un bono recién emitido. Cualquiera puede abrir cada paso en Stellar Expert.
              </p>
              <div className="space-y-3">
                {TRACE_EVENTS.map((e, i) => (
                  <div key={i} className="group flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-primary/40 hover:shadow-sm">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                      <CheckCircle2 size={16} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="font-semibold text-slate-900">{e.t}</p>
                        <span className="shrink-0 text-[11px] text-slate-400">{e.when}</span>
                      </div>
                      <p className="text-sm text-slate-600">{e.detail}</p>
                      <p className="mt-1 font-mono text-[11px] text-slate-400">{e.hash}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="sticky top-24 rounded-2xl border border-slate-900/90 bg-slate-900 p-7 text-slate-100">
                <h3 className="text-xl font-semibold leading-tight" style={{ fontFamily: 'Geist, sans-serif' }}>Lo que VELAR garantiza</h3>
                <p className="mt-2 text-sm text-slate-400">Cuatro propiedades técnicas, no promesas.</p>
                <ul className="mt-6 space-y-4">
                  {[
                    ['Inmutable', 'Stellar firma cada transacción y la red la confirma. Reescribir el historial es matemáticamente inviable.'],
                    ['Verificable', 'Cualquier persona puede abrir el bono en stellar.expert y leer su recorrido.'],
                    ['Auditable', 'El TSE consulta agregados, partidos y disputas desde un solo panel.'],
                    ['Independiente', 'Si VELAR desaparece, los registros siguen en la red Stellar.'],
                  ].map(([h, b]) => (
                    <li key={h} className="border-l-2 border-emerald-400 pl-4">
                      <p className="text-sm font-semibold text-white">{h}</p>
                      <p className="mt-1 text-sm leading-relaxed text-slate-400">{b}</p>
                    </li>
                  ))}
                </ul>
                <Link href="/signup" className="mt-7 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-400 hover:text-emerald-300">
                  Empezá a registrar bonos <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STAKEHOLDERS */}
      <section id="actores" className="border-b border-slate-200/60 py-24">
        <div className="mx-auto max-w-[1280px] px-6">
          <div className="mb-14 grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-end">
            <div className="lg:col-span-2">
              <h2 className="text-3xl font-bold leading-tight tracking-tight md:text-4xl" style={{ fontFamily: 'Geist, sans-serif' }}>
                Un mismo registro,<br />tres formas de usarlo.
              </h2>
            </div>
            <p className="text-slate-600 lg:pb-2">
              VELAR no le sirve solo a partidos o auditores. La transparencia tiene sentido
              cuando es accesible para todos los lados.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {STAKEHOLDERS.map((s) => (
              <div key={s.role} className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-7 transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg">
                <div className={`mb-5 inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-50 ${s.color}`}>
                  <s.Icon size={20} strokeWidth={2.2} />
                </div>
                <p className="mb-1 text-[12px] font-semibold uppercase tracking-wide text-slate-400">{s.role}</p>
                <h3 className="text-xl font-semibold leading-tight" style={{ fontFamily: 'Geist, sans-serif' }}>{s.headline}</h3>
                <ul className="mt-5 flex-1 space-y-3">
                  {s.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2.5 text-sm text-slate-600">
                      <CheckCircle2 size={14} className={`mt-0.5 shrink-0 ${s.color}`} strokeWidth={2.5} />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* METRICAS */}
      <section className="border-b border-slate-200/60 py-24">
        <div className="mx-auto max-w-[1280px] px-6">
          <p className="text-center text-[12px] font-semibold uppercase tracking-wide text-slate-400">
            Estado de la red en este momento
          </p>
          <div className="mt-10 grid grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-4">
            {[
              ['152', 'bonos emitidos'],
              ['₡2.4B', 'volumen movido'],
              ['98', 'transferencias'],
              ['3', 'partidos activos'],
            ].map(([n, l]) => (
              <div key={l} className="text-center">
                <p className="font-mono text-5xl font-bold tracking-tight text-slate-900 md:text-6xl" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{n}</p>
                <p className="mt-2 text-sm text-slate-500">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="bg-slate-900 py-24 text-slate-100">
        <div className="mx-auto max-w-[1280px] px-6 text-center">
          <h2 className="mx-auto max-w-3xl text-4xl font-bold leading-[1.1] tracking-tight md:text-5xl" style={{ fontFamily: 'Geist, sans-serif' }}>
            La trazabilidad ya no necesita<br /><span className="text-emerald-400">cajas de papel.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-slate-400">
            Creá tu cuenta y registrá el primer bono. Toda la red Stellar testnet es testigo.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link href="/signup" className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-[15px] font-semibold text-slate-900 transition hover:bg-slate-200">
              Crear cuenta <ArrowRight size={16} />
            </Link>
            <Link href="/marketplace" className="inline-flex h-12 items-center gap-2 rounded-full border border-slate-700 bg-transparent px-6 text-[15px] font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-800">
              Explorar el marketplace
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white py-10">
        <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <div className="flex items-center gap-2 text-slate-500">
            <svg width="18" height="18" viewBox="0 0 44 44" fill="none">
              <path d="M9 10 L22 33 L35 10" stroke="#0047C1" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-sm font-semibold text-slate-700">VELAR</span>
            <span className="text-sm">· Plataforma institucional</span>
          </div>
          <p className="text-xs text-slate-400">Proyecto académico · Bonos demostrativos en Stellar Testnet</p>
        </div>
      </footer>
    </main>
  );
}
