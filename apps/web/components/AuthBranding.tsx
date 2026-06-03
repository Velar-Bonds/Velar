/** Panel de marca (lado izquierdo) compartido por Login y Sign-up. */
export function VelarLogo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg width="40" height="40" viewBox="0 0 44 44" fill="none" aria-hidden>
        <path d="M9 10 L22 33 L35 10" stroke="#2563EB" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 10 L22 21 L28 10" stroke="#60A5FA" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity=".8" />
      </svg>
      <span className="text-3xl font-extrabold tracking-[0.18em] text-[#1E293B]">VELAR</span>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex w-[33%] flex-col items-center text-center">
      <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-blue-100">
        {icon}
      </div>
      <div className="text-sm font-bold text-[#1E293B]">{title}</div>
      <div className="mt-1 text-[11px] leading-tight text-slate-500">{desc}</div>
    </div>
  );
}

const ShieldIcon = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="#2563EB"><path d="M12 2 4 5v6c0 5 3.4 8.5 8 11 4.6-2.5 8-6 8-11V5l-8-3Z" /></svg>
);
const UsersIcon = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="#2563EB"><path d="M16 11a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm-8 0a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm0 2c-2.7 0-8 1.3-8 4v3h9v-3c0-1 .4-1.9 1-2.6A12 12 0 0 0 8 13Zm8 0c-.6 0-1.3 0-2 .1 1.3 1 2 2.2 2 2.9v3h8v-3c0-2.7-5.3-4-8-4Z" /></svg>
);
const BankIcon = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="#2563EB"><path d="M12 2 2 7v2h20V7L12 2ZM4 10v8H2v3h20v-3h-2v-8h-2v8h-3v-8h-2v8H8v-8H4Z" /></svg>
);

export function AuthBranding() {
  return (
    <div className="relative hidden flex-col justify-between overflow-hidden p-12 lg:flex">
      <div>
        <VelarLogo />

        <div className="mt-9 inline-flex items-center gap-2 rounded-full bg-[#E0EAFF] px-4 py-2 text-sm font-medium text-[#2563EB]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#2563EB"><path d="M12 2 4 5v6c0 5 3.4 8.5 8 11 4.6-2.5 8-6 8-11V5l-8-3Z" /></svg>
          Transparencia que se puede verificar.
        </div>

        <h1 className="mt-6 text-6xl font-extrabold leading-[1.05] text-[#1E293B]">
          Bienvenido a<br /><span className="text-[#2563EB]">VELAR</span>
        </h1>

        <p className="mt-5 max-w-md text-lg leading-relaxed text-slate-500">
          La plataforma de trazabilidad verificable que fortalece la transparencia, la integridad y la
          confianza en cada decisión pública.
        </p>

        <div className="mt-8 flex max-w-md gap-2">
          <Feature icon={ShieldIcon} title="Verificable" desc="Evidencia inmutable y verificable." />
          <Feature icon={UsersIcon} title="Confiable" desc="Datos públicos, seguros y auditables." />
          <Feature icon={BankIcon} title="Pública" desc="Tecnología al servicio del control ciudadano." />
        </div>
      </div>

      {/* Hero: V de cristal (render real). Guardar la imagen en public/velar-hero.png */}
      <div className="pointer-events-none absolute inset-x-0 bottom-24 flex justify-center">
        <img
          src="/velar-hero.png"
          alt="VELAR"
          className="w-[520px] max-w-[85%] object-contain mix-blend-multiply"
        />
      </div>

      <div className="relative z-10 flex gap-6 text-xs text-slate-500">
        <div className="flex items-start gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#2563EB"><path d="M17 9V7a5 5 0 0 0-10 0v2H5v13h14V9h-2ZM9 7a3 3 0 0 1 6 0v2H9V7Z" /></svg>
          <span><b className="text-[#1E293B]">Tu información está protegida con cifrado de nivel institucional.</b><br />Cumplimos con estándares de seguridad y privacidad de datos.</span>
        </div>
        <div className="flex items-start gap-2">
          {BankIcon}
          <span><b className="text-[#1E293B]">Tecnología pública,</b><br />confianza ciudadana.</span>
        </div>
      </div>
    </div>
  );
}
