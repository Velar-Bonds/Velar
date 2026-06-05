import Link from 'next/link';
import type { Metadata } from 'next';
import {
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
  Eye,
  CheckCircle2,
  Zap,
  Globe,
  FileSearch,
  Boxes,
  ChevronRight,
} from 'lucide-react';

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

function VelarLogo({ size = 36 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary-container to-primary text-white shadow-sm">
        <Boxes size={18} strokeWidth={2.3} />
      </div>
      <div className="leading-none">
        <p className="text-[15px] font-bold tracking-tight text-slate-900" style={{ fontFamily: 'Geist, sans-serif' }}>VELAR</p>
        <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-400">Ledger</p>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-slate-50/40 text-slate-900" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* ─── NAVBAR ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1320px] items-center justify-between px-6 lg:px-10">
          <Link href="/"><VelarLogo /></Link>
          <nav className="hidden items-center gap-1 md:flex">
            {[
              ['Inicio', '#hero', true],
              ['Proceso', '#proceso', false],
              ['Historial', '#historial', false],
              ['Consulta pública', '#consulta', false],
              ['Seguridad', '#seguridad', false],
              ['Documentación', '#docs', false],
            ].map(([label, href, active]) => (
              <a key={label as string} href={href as string}
                className={`relative px-3.5 py-2 text-[14px] transition-colors ${active ? 'font-semibold text-primary' : 'font-medium text-slate-600 hover:text-slate-900'}`}>
                {label}
                {active ? <span className="absolute -bottom-[1px] left-3.5 right-3.5 h-[2px] rounded-full bg-primary" /> : null}
              </a>
            ))}
          </nav>
          <Link href="/login"
            className="group inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-[14px] font-semibold text-white transition hover:bg-primary-container hover:shadow-lg hover:shadow-primary/25">
            Acceder a la plataforma
            <ArrowRight size={15} className="transition group-hover:translate-x-0.5" />
          </Link>
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
                <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
              </Link>
              <Link href="#proceso"
                className="inline-flex h-12 items-center gap-2 rounded-full border border-slate-300 bg-white px-6 text-[15px] font-semibold text-slate-700 transition hover:border-primary-container/40 hover:bg-slate-50">
                Explorar proceso
                <ArrowUpRight size={15} />
              </Link>
            </div>
          </div>

          {/* CARD FLOTANTE: Historial en tiempo real */}
          <div className="relative lg:col-span-6">
            <div className="relative">
              {/* glow detrás del card */}
              <div aria-hidden className="absolute -inset-6 -z-10 rounded-[40px] bg-gradient-to-br from-primary-container/15 via-sky-200/20 to-transparent blur-2xl" />

              <div className="relative overflow-hidden rounded-3xl border border-white/80 bg-white/95 p-7 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.25),0_8px_30px_-12px_rgba(21,94,239,0.18)] backdrop-blur-xl">
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
                  Ver detalles <ArrowRight size={13} />
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

      {/* ─── 2. PROCESO: 5 cards conectadas por flechas ──────────────────── */}
      <section id="proceso" className="border-t border-slate-200/60 bg-white py-24">
        <div className="mx-auto max-w-[1320px] px-6 lg:px-10">
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 lg:gap-0">
            {STEPS.map((s, i) => (
              <div key={s.n} className="relative lg:px-2">
                <div className="group relative h-full rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_18px_40px_-18px_rgba(21,94,239,0.25)]">
                  <div className="mb-5 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-[13px] font-bold text-white shadow-md shadow-primary/25">
                    {s.n}
                  </div>
                  <p className="font-semibold text-slate-900" style={{ fontFamily: 'Geist, sans-serif' }}>{s.name}</p>
                  <p className="mt-2 text-[13px] leading-relaxed text-slate-500">{s.desc}</p>
                </div>
                {/* Flecha entre cards (excepto la última) */}
                {i < STEPS.length - 1 && (
                  <div aria-hidden className="pointer-events-none absolute right-[-12px] top-1/2 hidden -translate-y-1/2 text-slate-300 lg:block">
                    <ChevronRight size={22} strokeWidth={1.5} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 3. HISTORIAL AUDITABLE (dark card) ──────────────────────────── */}
      <section id="historial" className="py-20">
        <div className="mx-auto max-w-[1320px] px-6 lg:px-10">
          <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-[#0a1530] p-8 text-slate-100 lg:p-12">
            {/* glow decorativo dentro de la card */}
            <div aria-hidden className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary-container/30 blur-3xl" />

            <div className="relative grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
              {/* Izquierda: características */}
              <div className="lg:col-span-4">
                <h2 className="text-3xl font-bold leading-tight tracking-tight text-white md:text-[36px]"
                    style={{ fontFamily: 'Geist, sans-serif' }}>
                  Historial auditable
                </h2>
                <p className="mt-4 text-[14.5px] leading-relaxed text-slate-400">
                  Explora eventos reales registrados en blockchain y verifica la integridad de cada movimiento.
                </p>

                <div className="mt-8 space-y-3">
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
              </div>

              {/* Derecha: tabla */}
              <div className="lg:col-span-8">
                <div className="overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/60 backdrop-blur">
                  <div className="grid grid-cols-[140px_1fr_110px_130px_140px_110px] gap-3 border-b border-slate-700/60 px-5 py-3 text-[10.5px] font-semibold uppercase tracking-wide text-slate-500">
                    <span>Evento</span>
                    <span>Descripción</span>
                    <span>Bloque</span>
                    <span>Hash</span>
                    <span>Tiempo</span>
                    <span>Estado</span>
                  </div>
                  {AUDIT_ROWS.map((r) => (
                    <div key={r.hash} className="grid grid-cols-[140px_1fr_110px_130px_140px_110px] items-center gap-3 border-b border-slate-800/80 px-5 py-3.5 text-[13px] transition hover:bg-slate-800/40 last:border-0">
                      <span className="inline-flex items-center gap-2 font-medium text-white">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary-container" />
                        {r.evento}
                      </span>
                      <span className="truncate text-slate-400">{r.descripcion}</span>
                      <span className="font-mono text-slate-300" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{r.bloque}</span>
                      <span className="font-mono text-slate-300" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{r.hash}</span>
                      <span className="text-slate-500">{r.tiempo}</span>
                      <span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Confirmado
                        </span>
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-5 text-center">
                  <a href="#consulta" className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-primary-container hover:text-white">
                    Ver historial completo en el explorador <ArrowRight size={14} />
                  </a>
                </div>
              </div>
            </div>
          </div>
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
                  <ArrowRight size={15} className="transition group-hover:translate-x-0.5" />
                </Link>
                <Link href="#seguridad"
                  className="inline-flex h-12 items-center gap-2 rounded-full border border-slate-300 bg-white px-6 text-[14.5px] font-semibold text-slate-700 transition hover:border-primary/30 hover:bg-slate-50">
                  Conocer más sobre seguridad
                  <ArrowUpRight size={14} />
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
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary-container to-primary text-white">
                  <Boxes size={18} strokeWidth={2.3} />
                </div>
                <p className="text-[15px] font-bold tracking-tight text-white" style={{ fontFamily: 'Geist, sans-serif' }}>VELAR</p>
              </div>
              <p className="mt-5 max-w-sm text-[13.5px] leading-relaxed text-slate-400">
                Plataforma blockchain para la trazabilidad, transparencia y validación de bonos políticos del TSE.
              </p>
              <div className="mt-6 flex items-center gap-2">
                {['X','GH','IN'].map((tag) => (
                  <a key={tag} href="#" className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 text-[10px] font-bold text-slate-400 transition hover:border-primary-container hover:text-white">
                    {tag}
                  </a>
                ))}
              </div>
            </div>

            {[
              { title: 'Producto', items: ['Proceso','Historial','Consulta pública','Seguridad'] },
              { title: 'Recursos', items: ['Documentación','API','Guías','Preguntas frecuentes'] },
              { title: 'Legal',    items: ['Términos de uso','Política de privacidad','Transparencia','Avisos legales'] },
            ].map((col) => (
              <div key={col.title}>
                <p className="mb-4 text-[12px] font-semibold uppercase tracking-wide text-slate-500">{col.title}</p>
                <ul className="space-y-2.5">
                  {col.items.map((it) => (
                    <li key={it}>
                      <a href="#" className="text-[14px] text-slate-400 transition hover:text-white">{it}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-slate-800 pt-6 sm:flex-row">
            <p className="text-[12.5px] text-slate-500">© 2026 VELAR Ledger · Todos los derechos reservados</p>
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
