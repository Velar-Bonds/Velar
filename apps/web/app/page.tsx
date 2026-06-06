import Link from 'next/link';
import type { Metadata } from 'next';
import {
  ShieldCheck,
  Eye,
  CheckCircle2,
  Zap,
  Globe,
  FileSearch,
  Landmark,
  Users,
} from 'lucide-react';
import { Reveal } from './_components/Reveal';
import { FAQ } from './_components/FAQ';
import { VelarBrand } from '../components/VelarBrand';

export const metadata: Metadata = {
  title: 'VELAR · Trazabilidad pública de bonos políticos',
  description: 'Plataforma blockchain para emitir, validar y consultar bonos políticos con transparencia pública en Stellar testnet.',
};

const STEPS = [
  { n: 1, name: 'Emisión',      desc: 'El TSE registra la emisión del bono político con todos sus detalles y condiciones.' },
  { n: 2, name: 'Asignación',   desc: 'Los bonos se asignan a partidos políticos autorizados según resolución oficial.' },
  { n: 3, name: 'Transferencia', desc: 'Cualquier movimiento queda registrado en cadena con trazabilidad completa.' },
  { n: 4, name: 'Validación',   desc: 'Los nodos validadores verifican cada transacción según las reglas del protocolo.' },
  { n: 5, name: 'Consulta',     desc: 'Información disponible para la ciudadanía en tiempo real a través del explorador.' },
];

const QUICK_FEATURES = [
  { Icon: ShieldCheck, title: 'Registro inmutable',          desc: 'Cada evento queda grabado en blockchain y no puede ser alterado.' },
  { Icon: Zap,         title: 'Validación en tiempo real',   desc: 'Los datos se validan al instante y se sincronizan con todos los nodos.' },
  { Icon: Globe,       title: 'Acceso público',              desc: 'Cualquier persona puede consultar la información de forma abierta.' },
  { Icon: FileSearch,  title: 'Historial auditable',         desc: 'Historial completo, trazable y verificable para auditorías ciudadanas.' },
];

const AUDIT_ROWS = [
  { evento: 'Emisión',       descripcion: 'Emisión de bonos políticos aprobada por el TSE',  bloque: '18 754 210', hash: '0x9a2f…8b7e1', tiempo: '14/05/2026 09:15:23' },
  { evento: 'Asignación',    descripcion: 'Asignación a Partido Esperanza Nacional',          bloque: '18 754 221', hash: '0x3c91…d4a93', tiempo: '14/05/2026 09:21:47' },
  { evento: 'Transferencia', descripcion: 'Transferencia a cuenta bancaria autorizada',       bloque: '18 754 245', hash: '0x7f3a…9c21d', tiempo: '14/05/2026 09:34:11' },
  { evento: 'Validación',    descripcion: 'Validación por nodos de la red',                   bloque: '18 754 250', hash: '0x1b67…aa551', tiempo: '14/05/2026 09:34:18' },
  { evento: 'Consulta',      descripcion: 'Consulta pública realizada desde el explorador',   bloque: '18 754 300', hash: '0x5d22…bb7c9', tiempo: '14/05/2026 09:45:02' },
];

const AUDIT_GUARANTEES = [
  { Icon: Eye,         title: 'Transparente',  desc: 'Datos abiertos y verificables por cualquier ciudadano.' },
  { Icon: ShieldCheck, title: 'Confiable',     desc: 'Infraestructura descentralizada con validadores independientes.' },
  { Icon: CheckCircle2,title: 'Verificable',   desc: 'Cada registro incluye hash, bloque y sello de tiempo.' },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-slate-50/40 text-slate-900" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* ─── NAVBAR (Server Component estático, navegación HTML pura) ───── */}
      <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1320px] items-center justify-between px-6 lg:px-10">
          <a href="/" className="flex items-center no-underline" aria-label="VELAR">
            <VelarBrand size="sm" />
          </a>

          <nav className="hidden items-center gap-1 md:flex">
            <a href="#hero" className="px-3.5 py-2 text-[14px] font-medium text-slate-600 no-underline hover:text-primary">Inicio</a>
            <a href="#proceso" className="px-3.5 py-2 text-[14px] font-medium text-slate-600 no-underline hover:text-primary">Proceso</a>
            <a href="#historial" className="px-3.5 py-2 text-[14px] font-medium text-slate-600 no-underline hover:text-primary">Historial</a>
            <a href="/explorer" className="px-3.5 py-2 text-[14px] font-medium text-slate-600 no-underline hover:text-primary">Explorador</a>
          </nav>

          <a
            href="/entrar"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-[14px] font-semibold text-white no-underline transition hover:bg-primary-container hover:shadow-lg hover:shadow-primary/25"
          >
            Acceder a la plataforma
          </a>
        </div>
      </header>

      {/* ─── 1. HERO ─────────────────────────────────────────────────────── */}
      <section id="hero" className="relative overflow-hidden">
        {/* Decoración de fondo: blobs radiales suaves */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -right-40 -top-32 h-[640px] w-[640px] rounded-full bg-gradient-to-br from-primary-container/30 via-blue-300/20 to-transparent blur-3xl" />
          <div className="absolute right-1/3 top-1/4 h-[420px] w-[420px] rounded-full bg-gradient-to-br from-sky-200/40 to-transparent blur-3xl" />
        </div>

        <div className="mx-auto grid max-w-[1320px] grid-cols-1 gap-12 px-6 pb-20 pt-16 lg:grid-cols-12 lg:gap-10 lg:px-10 lg:pt-24">
          {/* Copy */}
          <div className="lg:col-span-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/[0.06] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Blockchain para la transparencia pública
            </span>

            <h1 className="mt-7 text-[44px] font-bold leading-[1.04] tracking-tight text-slate-900 md:text-5xl lg:text-[60px] lg:leading-[1.02]"
                style={{ fontFamily: 'Geist, sans-serif' }}>
              Trazabilidad<br />
              verificable para la<br />
              emisión de <span className="text-primary-container">bonos<br />políticos</span>
            </h1>

            <p className="mt-7 max-w-[54ch] text-[17px] leading-relaxed text-slate-600">
              Registramos cada etapa del proceso de emisión de bonos políticos del TSE en blockchain,
              garantizando transparencia, validación y acceso público a un historial inmutable y auditable.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href="#historial"
                className="group inline-flex h-12 items-center gap-2 rounded-full bg-primary px-6 text-[15px] font-semibold text-white shadow-lg shadow-primary/20 transition hover:bg-primary-container hover:shadow-xl hover:shadow-primary/30">
                Ver historial público
              </Link>
              <Link href="#proceso"
                className="inline-flex h-12 items-center gap-2 rounded-full border border-slate-300 bg-white px-6 text-[15px] font-semibold text-slate-700 transition hover:border-primary-container/40 hover:bg-slate-50">
                Explorar proceso
              </Link>
            </div>
          </div>

          {/* CARD FLOTANTE: Historial en tiempo real */}
          <div className="relative lg:col-span-6">
            <div className="relative">
              {/* glow detrás del card */}
              <div aria-hidden className="absolute -inset-6 -z-10 rounded-[40px] bg-gradient-to-br from-primary-container/15 via-sky-200/20 to-transparent blur-2xl" />

              <div
                className="relative isolate overflow-hidden rounded-3xl border border-white/60 p-7 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.25),0_8px_30px_-12px_rgba(21,94,239,0.18),inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-2xl backdrop-saturate-150"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(255,255,255,0.55), rgba(255,255,255,0.25)), rgba(241,245,255,0.45)',
                }}
              >
                {/* highlight superior interno (refracción glass) */}
                <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
                {/* highlight radial top-left */}
                <div aria-hidden className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/40 blur-2xl" />
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-[17px] font-semibold text-slate-900" style={{ fontFamily: 'Geist, sans-serif' }}>
                    Historial en tiempo real
                  </h3>
                  <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-emerald-600">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                    </span>
                    En vivo
                  </span>
                </div>

                {/* Stepper horizontal con línea conectora */}
                <div className="relative mb-7">
                  <div className="absolute left-3 right-3 top-3 h-px bg-gradient-to-r from-primary-container/30 via-primary-container to-slate-200" />
                  <div className="relative flex justify-between">
                    {['Emisión','Asignación','Transferencia','Validación','Consulta'].map((s, i) => {
                      const active = i <= 2;
                      const current = i === 2;
                      return (
                        <div key={s} className="flex flex-col items-center gap-2">
                          <div className={`relative flex h-7 w-7 items-center justify-center rounded-full border-2 transition ${
                            current
                              ? 'border-primary bg-white shadow-lg shadow-primary/25'
                              : active
                                ? 'border-primary bg-primary text-white'
                                : 'border-slate-300 bg-white'
                          }`}>
                            {current
                              ? <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                              : active
                                ? <CheckCircle2 size={14} strokeWidth={2.8} />
                                : <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />}
                          </div>
                          <span className={`text-[10.5px] font-medium ${active ? 'text-slate-700' : 'text-slate-400'}`}>{s}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Transacción reciente */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
                  <p className="mb-4 text-[12px] font-semibold uppercase tracking-wide text-slate-500">
                    Transacción reciente
                  </p>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      ['ID de transacción', '0x7f3a…9c21d', true],
                      ['Bloque',            '18 754 321',  true],
                      ['Tiempo',            'Hace 2 min',  false],
                      ['Estado',            'Confirmado',  false],
                    ].map(([label, val, mono]) => (
                      <div key={label as string}>
                        <p className="text-[10.5px] font-medium uppercase tracking-wide text-slate-500">{label}</p>
                        <p className={`mt-1 truncate text-[12.5px] font-semibold text-slate-900 ${mono ? 'font-mono' : ''}`}
                           style={mono ? { fontFamily: 'JetBrains Mono, monospace' } : {}}>
                          {label === 'Estado'
                            ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {val}
                              </span>
                            : val}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <a href="#historial" className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary hover:text-primary-container">
                  Abrir detalle
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* STRIP de 4 cards flotantes bajo el hero */}
        <div className="mx-auto -mt-2 max-w-[1320px] px-6 pb-16 lg:px-10">
          <div className="grid grid-cols-1 gap-4 rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-[0_8px_30px_-12px_rgba(15,23,42,0.10)] backdrop-blur md:grid-cols-2 lg:grid-cols-4 lg:gap-2">
            {QUICK_FEATURES.map(({ Icon, title, desc }) => (
              <div key={title} className="group flex items-start gap-4 rounded-2xl p-4 transition hover:bg-slate-50">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/[0.08] text-primary transition group-hover:bg-primary group-hover:text-white">
                  <Icon size={18} strokeWidth={2.2} />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{title}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-slate-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Proceso: 5 cards conectadas por lineas suaves */}
      <section id="proceso" className="border-t border-slate-200/60 bg-white py-24">
        <div className="mx-auto max-w-[1320px] px-6 lg:px-10">
          <Reveal>
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-primary">
                Proceso de emisión
              </p>
              <h2 className="text-3xl font-bold leading-tight tracking-tight text-slate-900 md:text-[40px] md:leading-[1.1]"
                  style={{ fontFamily: 'Geist, sans-serif' }}>
                Un flujo transparente, paso a paso
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-slate-600">
                Cada etapa del ciclo de vida del bono político queda registrada, validada y disponible para consulta.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 lg:gap-0">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 0.07}>
                <div className="relative lg:px-2">
                  <div className="group relative h-full rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_18px_40px_-18px_rgba(21,94,239,0.25)]">
                    <div className="mb-5 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-[13px] font-bold text-white shadow-md shadow-primary/25">
                      {s.n}
                    </div>
                    <p className="font-semibold text-slate-900" style={{ fontFamily: 'Geist, sans-serif' }}>{s.name}</p>
                    <p className="mt-2 text-[13px] leading-relaxed text-slate-500">{s.desc}</p>
                  </div>
                  {/* Conector entre cards */}
                  {i < STEPS.length - 1 && (
                    <div aria-hidden className="pointer-events-none absolute right-[-10px] top-1/2 hidden h-px w-5 -translate-y-1/2 bg-slate-300 lg:block" />
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 2.5 PARA QUIÉN ES VELAR ──────────────────────────────────────── */}
      <section id="quienes" className="border-t border-slate-200/60 bg-gradient-to-b from-white to-slate-50/40 py-24">
        <div className="mx-auto max-w-[1320px] px-6 lg:px-10">
          <Reveal>
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <h2 className="text-3xl font-bold leading-tight tracking-tight text-slate-900 md:text-[40px] md:leading-[1.1]"
                  style={{ fontFamily: 'Geist, sans-serif' }}>
                Un mismo registro,<br />tres formas de usarlo
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-slate-600">
                VELAR no le sirve solo a partidos o auditores. La transparencia tiene sentido
                cuando es accesible para todos los lados de la mesa.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {[
              {
                Icon: Landmark,
                accent: 'from-primary-container to-primary',
                role: 'Para el partido',
                headline: 'Financiá la campaña con respaldo verificable.',
                bullets: [
                  'Solicitá bonos al TSE y seguí el estado en vivo',
                  'Publicá en el marketplace cuando estén aprobados',
                  'Cada movimiento queda firmado en tu wallet de custodia',
                ],
                cta: 'Crear cuenta de partido',
                href: '/signup',
              },
              {
                Icon: ShieldCheck,
                accent: 'from-emerald-500 to-emerald-700',
                role: 'Para el TSE',
                headline: 'Supervisá el sistema completo sin recibir papeles.',
                bullets: [
                  'Aprobá o rechazá solicitudes con motivo registrado',
                  'Visualizá análisis por partido, montos y reventas',
                  'Resolvé disputas retirando el bono del escrow',
                ],
                cta: 'Acceso institucional',
                href: '/login',
              },
              {
                Icon: Users,
                accent: 'from-slate-600 to-slate-900',
                role: 'Para la ciudadanía',
                headline: 'Verificá quién financia qué, sin pedir permiso.',
                bullets: [
                  'Consultá la trazabilidad de cualquier bono',
                  'Abrí cualquier transacción en Stellar Expert',
                  'El historial es público y no se puede alterar',
                ],
                cta: 'Explorar historial público',
                href: '#historial',
              },
            ].map((s, i) => (
              <Reveal key={s.role} delay={i * 0.08}>
                <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-7 transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_24px_60px_-30px_rgba(15,23,42,0.25)]">
                  {/* gradient accent bar */}
                  <div aria-hidden className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${s.accent}`} />

                  <div className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${s.accent} text-white shadow-md`}>
                    <s.Icon size={20} strokeWidth={2.2} />
                  </div>
                  <p className="mb-1 text-[11.5px] font-semibold uppercase tracking-[0.12em] text-slate-400">{s.role}</p>
                  <h3 className="text-[19px] font-semibold leading-snug text-slate-900" style={{ fontFamily: 'Geist, sans-serif' }}>
                    {s.headline}
                  </h3>
                  <ul className="mt-5 flex-1 space-y-3">
                    {s.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2.5 text-[14px] text-slate-600">
                        <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-500" strokeWidth={2.4} />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href={s.href} className="mt-6 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-primary transition group-hover:translate-x-0.5 hover:text-primary-container">
                    {s.cta}
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 3. HISTORIAL AUDITABLE (dark, full-width, centrado) ─────────── */}
      <section id="historial" className="py-20">
        <div className="mx-auto max-w-[1320px] px-6 lg:px-10">
          <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-[#0a1530] p-8 text-slate-100 lg:p-12">
            {/* glows decorativos */}
            <div aria-hidden className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary-container/30 blur-3xl" />
            <div aria-hidden className="pointer-events-none absolute -left-32 bottom-0 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl" />

            {/* Header centrado */}
            <div className="relative mx-auto mb-10 max-w-2xl text-center">
              <h2 className="text-3xl font-bold leading-tight tracking-tight text-white md:text-[40px]"
                  style={{ fontFamily: 'Geist, sans-serif' }}>
                Historial auditable
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-slate-400">
                Explora eventos reales registrados en blockchain y verifica la integridad de cada movimiento.
              </p>
            </div>

            {/* Garantías horizontales (3 columnas, full-width) */}
            <div className="relative mb-8 grid grid-cols-1 gap-3 md:grid-cols-3">
              {AUDIT_GUARANTEES.map(({ Icon, title, desc }) => (
                <div key={title} className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4 backdrop-blur">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-container/15 text-primary-container">
                      <Icon size={16} strokeWidth={2.3} />
                    </div>
                    <p className="font-semibold text-white">{title}</p>
                  </div>
                  <p className="mt-2 text-[13px] leading-relaxed text-slate-400">{desc}</p>
                </div>
              ))}
            </div>

            {/* Tabla full-width */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/60 backdrop-blur">
              <div className="hidden grid-cols-[160px_1fr_140px_160px_180px_140px] gap-3 border-b border-slate-700/60 px-6 py-4 text-[11px] font-semibold uppercase tracking-wide text-slate-500 md:grid">
                <span>Evento</span>
                <span>Descripción</span>
                <span>Bloque</span>
                <span>Hash</span>
                <span>Tiempo</span>
                <span>Estado</span>
              </div>
              {AUDIT_ROWS.map((r) => (
                <div key={r.hash} className="grid grid-cols-1 items-center gap-3 border-b border-slate-800/80 px-6 py-4 text-[13.5px] transition hover:bg-slate-800/40 last:border-0 md:grid-cols-[160px_1fr_140px_160px_180px_140px]">
                  <span className="inline-flex items-center gap-2 font-medium text-white">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary-container" />
                    {r.evento}
                  </span>
                  <span className="text-slate-400">{r.descripcion}</span>
                  <span className="font-mono text-slate-300" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{r.bloque}</span>
                  <span className="font-mono text-slate-300" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{r.hash}</span>
                  <span className="text-slate-500">{r.tiempo}</span>
                  <span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Confirmado
                    </span>
                  </span>
                </div>
              ))}
            </div>

            <div className="relative mt-7 text-center">
              <a href="#consulta" className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-primary-container hover:text-white">
                Abrir historial completo en el explorador
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3.5 FAQ ──────────────────────────────────────────────────────── */}
      <section id="faq" className="border-t border-slate-200/60 bg-slate-50/50 py-24">
        <div className="mx-auto max-w-[1320px] px-6 lg:px-10">
          <Reveal>
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <h2 className="text-3xl font-bold leading-tight tracking-tight text-slate-900 md:text-[40px] md:leading-[1.1]"
                  style={{ fontFamily: 'Geist, sans-serif' }}>
                Lo que la gente nos pregunta
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-slate-600">
                Respuestas honestas a las dudas que aparecen antes de confiar en una plataforma así.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <FAQ />
          </Reveal>
        </div>
      </section>

      {/* ─── 4. CTA FINAL ────────────────────────────────────────────────── */}
      <section id="consulta" className="bg-gradient-to-b from-white to-slate-100 py-24">
        <div className="mx-auto max-w-[1320px] px-6 lg:px-10">
          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-10 shadow-[0_18px_60px_-30px_rgba(15,23,42,0.18)] lg:p-14">
            <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-primary-container/10 blur-3xl" />
            <div aria-hidden className="pointer-events-none absolute -bottom-32 right-1/3 h-72 w-72 rounded-full bg-sky-200/30 blur-3xl" />

            <div className="relative grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <h2 className="text-[34px] font-bold leading-[1.1] tracking-tight text-slate-900 md:text-[44px]"
                    style={{ fontFamily: 'Geist, sans-serif' }}>
                  Transparencia que fortalece<br />la democracia
                </h2>
                <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-slate-600">
                  Un sistema abierto, seguro y basado en blockchain para garantizar la confianza ciudadana.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 lg:col-span-5 lg:justify-end">
                <Link href="/marketplace"
                  className="group inline-flex h-12 items-center gap-2 rounded-full bg-primary px-6 text-[14.5px] font-semibold text-white shadow-lg shadow-primary/25 transition hover:bg-primary-container hover:shadow-xl hover:shadow-primary/30">
                  Explorar historial público
                </Link>
                <Link href="#seguridad"
                  className="inline-flex h-12 items-center gap-2 rounded-full border border-slate-300 bg-white px-6 text-[14.5px] font-semibold text-slate-700 transition hover:border-primary/30 hover:bg-slate-50">
                  Conocer más sobre seguridad
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 bg-slate-900 py-16 text-slate-300">
        <div className="mx-auto max-w-[1320px] px-6 lg:px-10">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <div className="flex items-center">
                <VelarBrand size="sm" darkSurface />
              </div>
              <p className="mt-5 max-w-sm text-[13.5px] leading-relaxed text-slate-400">
                Plataforma blockchain para la trazabilidad, transparencia y validación de bonos políticos del TSE.
              </p>
              <div className="mt-6 flex items-center gap-2">
                {/* X (Twitter) */}
                <a href="#" aria-label="X / Twitter" className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 text-slate-400 transition hover:border-primary-container hover:text-white">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
                {/* GitHub */}
                <a href="#" aria-label="GitHub" className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 text-slate-400 transition hover:border-primary-container hover:text-white">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2.13c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.79 0c2.21-1.49 3.18-1.18 3.18-1.18.62 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.69 5.4-5.25 5.68.41.36.78 1.07.78 2.16v3.21c0 .31.21.66.79.55C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z"/></svg>
                </a>
                {/* LinkedIn */}
                <a href="#" aria-label="LinkedIn" className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 text-slate-400 transition hover:border-primary-container hover:text-white">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.95v5.66H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.59 0 4.26 2.36 4.26 5.43v6.31zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z"/></svg>
                </a>
                {/* Instagram */}
                <a href="#" aria-label="Instagram" className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 text-slate-400 transition hover:border-primary-container hover:text-white">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.42.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.42 2.23.06 1.26.07 1.64.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.42 2.23a3.7 3.7 0 0 1-.9 1.38c-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.42-1.26.06-1.64.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.42a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.42-2.23-.06-1.26-.07-1.64-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.42-2.23.22-.56.48-.96.9-1.38a3.7 3.7 0 0 1 1.38-.9c.42-.16 1.06-.36 2.23-.42 1.26-.06 1.64-.07 4.85-.07zm0 5.84a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 1.4a2.6 2.6 0 1 1 0 5.2 2.6 2.6 0 0 1 0-5.2zm5.1-1.96a.95.95 0 1 1 0 1.9.95.95 0 0 1 0-1.9z"/></svg>
                </a>
              </div>
            </div>

            {[
              { title: 'Producto', items: [['Proceso','#proceso'],['Historial','#historial'],['Consulta pública','/explorer']] },
              { title: 'On-chain', items: [['Ledger público','/explorer'],['Asset VCRC','/explorer#vcrc'],['Documentación','#'],['API','#']] },
              { title: 'Legal',    items: [['Términos de uso','#'],['Política de privacidad','#'],['Transparencia','#']] },
            ].map((col) => (
              <div key={col.title}>
                <p className="mb-4 text-[12px] font-semibold uppercase tracking-wide text-slate-500">{col.title}</p>
                <ul className="space-y-2.5">
                  {col.items.map(([label, href]) => (
                    <li key={label}>
                      <a href={href} className="text-[14px] text-slate-400 transition hover:text-white">{label}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-slate-800 pt-6 sm:flex-row">
            <p className="text-[12.5px] text-slate-500">© 2026 VELAR · Todos los derechos reservados</p>
            <div className="flex flex-wrap items-center gap-4 text-[12.5px] text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Red blockchain pública
              </span>
              <span>· Datos abiertos</span>
              <span>· Código abierto</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
