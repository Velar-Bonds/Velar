import Link from 'next/link';

const Arrow = ({ w = 'w-4 h-4' }: { w?: string }) => (
  <svg className={w} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} /></svg>
);

export default function LandingPage() {
  return (
    <div className="bg-background text-on-surface" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <header className="glass-panel fixed top-0 z-50 w-full border-b border-outline-variant/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            <div className="flex flex-shrink-0 items-center gap-2">
              <img alt="VELAR" className="h-9 w-auto" src="/velar-logo.png" />
            </div>
            <nav className="hidden space-x-8 md:flex">
              <a className="text-sm font-medium text-primary" href="#">Inicio</a>
              <a className="text-sm font-medium text-on-surface-variant transition-colors hover:text-primary" href="#proceso">Proceso</a>
              <a className="text-sm font-medium text-on-surface-variant transition-colors hover:text-primary" href="#historial">Historial</a>
              <a className="text-sm font-medium text-on-surface-variant transition-colors hover:text-primary" href="#historial">Consulta pública</a>
              <a className="text-sm font-medium text-on-surface-variant transition-colors hover:text-primary" href="#seguridad">Seguridad</a>
            </nav>
            <div className="hidden items-center md:flex">
              <Link className="flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-white shadow-md transition-all hover:bg-primary-container hover:shadow-lg" href="/login">
                Acceder a la plataforma <Arrow />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="relative overflow-hidden pb-20 pt-32">
        <div className="bg-blob-1" /><div className="bg-blob-2" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12">
            <div className="flex flex-col justify-center lg:col-span-5">
              <div className="mb-6 inline-flex w-max items-center gap-2 rounded-full border border-outline-variant/30 bg-surface-container px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" /> Blockchain para la transparencia pública
              </div>
              <h1 className="mb-6 text-4xl font-bold leading-[1.1] tracking-tight text-on-surface lg:text-5xl">
                Trazabilidad<br />verificable para la<br /><span className="text-primary">emisión de bonos<br />políticos</span>
              </h1>
              <p className="mb-8 text-lg leading-relaxed text-on-surface-variant">
                Registramos cada etapa del proceso de emisión de bonos políticos del TSE en blockchain, garantizando transparencia, validación y acceso público a un historial inmutable y auditable.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <a className="flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-3.5 text-base font-medium text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-container" href="#historial">Ver historial público <Arrow /></a>
                <a className="flex items-center justify-center gap-2 rounded-full border border-outline-variant bg-white px-8 py-3.5 text-base font-medium text-on-surface-variant transition-all hover:bg-surface-container" href="#proceso">Explorar proceso <Arrow /></a>
              </div>
            </div>

            <div className="relative flex justify-end pt-4 lg:col-span-7">
              <img alt="" className="pointer-events-none absolute -top-48 right-[-150px] z-0 h-[1100px] w-[1100px] rotate-6 object-contain opacity-40" src="/landing-orbital.png" />
              <div className="glass-panel relative z-10 w-full max-w-lg rounded-2xl bg-white/20 p-6 shadow-glass backdrop-blur-2xl lg:p-8">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-on-surface">Historial en tiempo real</h3>
                  <div className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" /> En vivo
                  </div>
                </div>
                <div className="relative mb-10 flex justify-between px-2">
                  <div className="absolute left-8 right-8 top-3 z-0 h-0.5 bg-outline-variant/40" />
                  <div className="absolute left-8 top-3 z-0 h-0.5 w-[60%] bg-primary" />
                  {[['Emisión', true], ['Asignación', true], ['Transferencia', 'now'], ['Validación', false], ['Consulta', false]].map(([label, st], i) => (
                    <div key={i} className="relative z-10 flex flex-col items-center gap-2">
                      {st === true && <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white shadow-lg"><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} /></svg></div>}
                      {st === 'now' && <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-primary shadow-md"><div className="h-2 w-2 rounded-full bg-white" /></div>}
                      {st === false && <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-surface-container" />}
                      <span className={`text-[10px] font-semibold ${st === 'now' ? 'text-on-surface' : st ? 'text-on-surface-variant' : 'text-outline'}`}>{label}</span>
                    </div>
                  ))}
                </div>
                <div className="mb-6 rounded-2xl border border-outline-variant/50 bg-white/80 p-5 shadow-sm">
                  <h4 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-outline">Transacción reciente</h4>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    {[['ID TRANSACCIÓN', '0x7f3a…9c21'], ['BLOQUE', '18,754,321'], ['TIEMPO', 'Hace 2 min']].map(([k, v]) => (
                      <div key={k}><span className="mb-1 block text-[10px] text-outline">{k}</span><span className="text-xs font-semibold text-on-surface" style={{ fontFamily: 'JetBrains Mono' }}>{v}</span></div>
                    ))}
                    <div><span className="mb-1 block text-[10px] text-outline">ESTADO</span><span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Confirmado</span></div>
                  </div>
                </div>
                <a className="flex items-center gap-1.5 text-sm font-bold text-primary transition-all hover:gap-2.5" href="#historial">Ver detalles en explorador <Arrow /></a>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Features */}
      <section className="relative z-20 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {[
              ['M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', 'Registro inmutable', 'Cada evento queda grabado en blockchain y no puede ser alterado.'],
              ['M13 10V3L4 14h7v7l9-11h-7z', 'Validación en tiempo real', 'Los datos se validan al instante y se sincronizan con todos los nodos de la red.'],
              ['M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9', 'Acceso público', 'Cualquier persona puede consultar la información de forma abierta y gratuita.'],
              ['M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', 'Historial auditable', 'Historial completo, trazable y verificable para auditorías y control ciudadano.'],
            ].map(([d, t, p]) => (
              <div key={t} className="flex flex-1 flex-col items-start gap-5 rounded-2xl border border-outline-variant/30 bg-white p-8 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary/5 text-primary">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d={d} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} /></svg>
                </div>
                <div><h3 className="mb-2 text-lg font-bold text-on-surface">{t}</h3><p className="text-sm leading-relaxed text-on-surface-variant">{p}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section id="proceso" className="relative bg-surface-container-low py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="mb-2 text-sm font-bold uppercase tracking-widest text-primary">PROCESO DE EMISIÓN</h2>
            <h3 className="mb-4 text-3xl font-bold text-on-surface">Un flujo transparente, paso a paso</h3>
            <p className="text-on-surface-variant">Cada etapa del ciclo de vida del bono político queda registrada, validada y disponible para consulta.</p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-5">
            {[
              ['Emisión', 'El TSE registra la emisión del bono político con todos sus detalles y condiciones.'],
              ['Asignación', 'Los bonos se asignan a partidos políticos autorizados según resolución oficial.'],
              ['Transferencia', 'Cualquier movimiento queda registrado en blockchain con trazabilidad completa.'],
              ['Validación', 'Se verifica cada transacción según las reglas del protocolo.'],
              ['Consulta', 'Información disponible para la ciudadanía en tiempo real en el explorador público.'],
            ].map(([t, p], i) => (
              <div key={t} className="relative rounded-2xl border border-outline-variant/30 bg-white p-6 shadow-sm">
                <div className="mb-4 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">{i + 1}</div>
                <h4 className="mb-2 font-semibold text-on-surface">{t}</h4>
                <p className="text-xs leading-relaxed text-on-surface-variant">{p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Explorer */}
      <section id="historial" className="relative overflow-hidden bg-inverse-surface py-24">
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-12 lg:flex-row">
            <div className="text-white lg:w-1/3">
              <h2 className="mb-6 text-3xl font-bold">Historial auditable</h2>
              <p className="mb-10 text-sm leading-relaxed text-inverse-on-surface opacity-80">Explora eventos reales registrados en blockchain y verifica la integridad de cada movimiento.</p>
              <div className="space-y-8">
                {[['Transparente', 'Datos abiertos y verificables por cualquier ciudadano.'], ['Confiable', 'Infraestructura descentralizada con validadores independientes.'], ['Verificable', 'Cada registro incluye hash, bloque y sello de tiempo.']].map(([t, p]) => (
                  <div key={t} className="flex gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/20"><span className="material-symbols-outlined text-primary-fixed">check_circle</span></div>
                    <div><h4 className="mb-1 font-medium text-white">{t}</h4><p className="text-xs text-inverse-on-surface opacity-70">{p}</p></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl lg:w-2/3">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-white">
                  <thead className="border-b border-white/10 bg-white/5 text-xs uppercase text-inverse-on-surface">
                    <tr>{['Evento', 'Descripción', 'Bloque', 'Hash', 'Tiempo', 'Estado'].map((h) => <th key={h} className="px-8 py-5 text-xs font-semibold uppercase tracking-wider">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {[
                      ['Emisión', 'Emisión aprobada por TSE', '18,754,210', '0x9a2f…8b7e1', '14/05/24 09:15'],
                      ['Asignación', 'Partido Liberación Nacional', '18,754,221', '0x3c91…d4a93', '14/05/24 09:21'],
                      ['Transferencia', 'Cuenta autorizada', '18,754,245', '0x7f3a…9c21d', '14/05/24 09:34'],
                    ].map((r) => (
                      <tr key={r[3]} className="transition-colors hover:bg-white/10">
                        <td className="whitespace-nowrap px-8 py-6 font-medium">{r[0]}</td>
                        <td className="whitespace-nowrap px-8 py-6">{r[1]}</td>
                        <td className="whitespace-nowrap px-8 py-6">{r[2]}</td>
                        <td className="whitespace-nowrap px-8 py-6">{r[3]}</td>
                        <td className="whitespace-nowrap px-8 py-6">{r[4]}</td>
                        <td className="whitespace-nowrap px-8 py-6"><span className="inline-flex items-center rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-400">Confirmado</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="seguridad" className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative flex flex-col items-center justify-between overflow-hidden rounded-[2.5rem] border border-outline-variant/30 bg-surface-container p-10 lg:flex-row">
            <div className="absolute right-0 top-0 h-64 w-64 -translate-y-1/2 translate-x-1/3 rounded-full bg-primary/10 opacity-50 blur-3xl" />
            <div className="relative z-10 mb-10 lg:mb-0 lg:w-1/2">
              <h2 className="mb-4 text-3xl font-bold leading-tight text-on-surface lg:text-4xl">Transparencia que fortalece<br />la democracia</h2>
              <p className="mb-8 max-w-md text-on-surface-variant">Un sistema abierto, seguro y basado en blockchain para garantizar la confianza ciudadana.</p>
              <Link className="flex w-max items-center justify-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm font-medium text-white shadow-md transition-all hover:bg-primary-container" href="/login">Acceder a la plataforma <Arrow /></Link>
            </div>
            <div className="relative z-10 flex justify-center lg:w-1/2 lg:justify-end">
              <img alt="Seguridad" className="animate-float h-auto w-full max-w-[400px] object-contain" src="/landing-shield.png" style={{ mixBlendMode: 'multiply' }} />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-inverse-surface pb-8 pt-16 text-inverse-on-surface">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <img alt="VELAR" className="mb-6 h-10 w-auto brightness-0 invert" src="/velar-logo.png" />
              <p className="mb-6 max-w-xs text-sm leading-relaxed opacity-70">Plataforma blockchain para la trazabilidad, transparencia y validación de bonos políticos del TSE.</p>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold text-white">Producto</h4>
              <ul className="space-y-3 text-sm opacity-70"><li><a className="hover:text-white" href="#proceso">Proceso</a></li><li><a className="hover:text-white" href="#historial">Historial</a></li><li><a className="hover:text-white" href="#seguridad">Seguridad</a></li></ul>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold text-white">Recursos</h4>
              <ul className="space-y-3 text-sm opacity-70"><li><a className="hover:text-white" href="#">Documentación</a></li><li><a className="hover:text-white" href="#">API</a></li><li><a className="hover:text-white" href="#">FAQ</a></li></ul>
            </div>
            <div className="lg:ml-auto">
              <h4 className="mb-4 text-sm font-semibold text-white">Acceso</h4>
              <Link className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-white" href="/login">Ingresar <Arrow /></Link>
            </div>
          </div>
          <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-xs opacity-50 md:flex-row">
            <p>© 2026 VELAR. Todos los derechos reservados.</p>
            <div className="flex gap-4"><span>Blockchain pública</span><span>•</span><span>Datos abiertos</span></div>
          </div>
        </div>
      </footer>
    </div>
  );
}
