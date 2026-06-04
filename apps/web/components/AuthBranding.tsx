import type { ReactNode } from 'react';
import { HeroArt } from './HeroArt';

function VelarLogo() {
  return (
    <div className="flex items-center gap-3">
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden>
        <path d="M9 10 L22 33 L35 10" stroke="#2563EB" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 10 L22 21 L28 10" stroke="#60A5FA" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity=".8" />
      </svg>
      <span className="velar-brand-text text-3xl font-extrabold tracking-[0.14em]">VELAR</span>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: ReactNode; title: string; desc: string }) {
  return (
    <div className="flex max-w-[140px] flex-col items-center text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[#dbe6ff] bg-white shadow-[0_12px_28px_rgba(37,99,235,0.08)]">
        {icon}
      </div>
      <p className="text-sm font-semibold text-[#0f235f]">{title}</p>
      <p className="mt-2 text-xs leading-5 text-[#5b6b95]">{desc}</p>
    </div>
  );
}

const ShieldIcon = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="#2563EB" aria-hidden>
    <path d="M12 2 4 5v6c0 5 3.4 8.5 8 11 4.6-2.5 8-6 8-11V5l-8-3Z" />
  </svg>
);

const UsersIcon = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="#2563EB" aria-hidden>
    <path d="M16 11a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm-8 0a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm0 2c-2.7 0-8 1.3-8 4v3h9v-3c0-1 .4-1.9 1-2.6A12 12 0 0 0 8 13Zm8 0c-.6 0-1.3 0-2 .1 1.3 1 2 2.2 2 2.9v3h8v-3c0-2.7-5.3-4-8-4Z" />
  </svg>
);

const BankIcon = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="#2563EB" aria-hidden>
    <path d="M12 2 2 7v2h20V7L12 2ZM4 10v8H2v3h20v-3h-2v-8h-2v8h-3v-8h-2v8H8v-8H4Z" />
  </svg>
);

export function AuthBranding() {
  return (
    <section className="relative hidden h-full overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.72),_rgba(234,242,255,0.52)_48%,_rgba(228,238,255,0.58))] px-9 py-8 lg:flex lg:w-[55%] lg:flex-col lg:justify-between xl:px-12">
      <div className="absolute inset-x-0 bottom-0 h-[44%] bg-[radial-gradient(circle_at_30%_90%,rgba(37,99,235,0.12),transparent_42%),radial-gradient(circle_at_82%_20%,rgba(96,165,250,0.16),transparent_34%)]" />
      <div className="absolute bottom-0 left-[-8%] h-[340px] w-[760px] rounded-full bg-[radial-gradient(circle,_rgba(255,255,255,0.65),rgba(255,255,255,0))] blur-3xl" />
      <div className="absolute inset-y-0 right-0 w-[180px] bg-[radial-gradient(circle_at_right,_rgba(37,99,235,0.08),transparent_62%)]" />

      <div className="relative z-10">
        <VelarLogo />

        <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-[#9fc0ff] bg-[#edf4ff] px-4 py-2 text-sm font-medium text-[#1f5eff]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 2 4 5v6c0 5 3.4 8.5 8 11 4.6-2.5 8-6 8-11V5l-8-3Z" />
          </svg>
          Transparencia que se puede verificar.
        </div>

        <h1 className="velar-brand-text mt-6 text-5xl font-extrabold leading-[0.98] tracking-[-0.03em] text-[#10235d] xl:text-6xl">
          Bienvenido a
          <span className="mt-2 block text-[#1f63ff]">VELAR</span>
        </h1>

        <p className="mt-5 max-w-[440px] text-base leading-8 text-[#53658f] xl:text-[1.08rem]">
          La plataforma de trazabilidad verificable que fortalece la transparencia, la integridad y la
          confianza en cada decision publica.
        </p>

        <div className="mt-8 flex gap-6">
          <Feature icon={ShieldIcon} title="Verificable" desc="Evidencia inmutable y verificable." />
          <Feature icon={UsersIcon} title="Confiable" desc="Datos publicos, seguros y auditables." />
          <Feature icon={BankIcon} title="Publica" desc="Tecnologia al servicio del control ciudadano." />
        </div>
      </div>

      <div className="pointer-events-none relative z-10 mt-5 flex min-h-[260px] items-end justify-center xl:min-h-[300px]">
        <HeroArt />
      </div>

      <div className="relative z-10 grid grid-cols-2 gap-0 overflow-hidden rounded-2xl border border-[#d9e5fb] bg-white/72 text-xs text-[#5b6b95] shadow-[0_12px_30px_rgba(15,35,93,0.06)] backdrop-blur-sm">
        <div className="flex items-start gap-3 px-5 py-4">
          <div className="mt-0.5 text-[#2563EB]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M17 9V7a5 5 0 0 0-10 0v2H5v13h14V9h-2ZM9 7a3 3 0 0 1 6 0v2H9V7Z" />
            </svg>
          </div>
          <p className="leading-5">
            <span className="block font-semibold text-[#10235d]">Tu informacion esta protegida con cifrado de nivel institucional.</span>
            Cumplimos con estandares de seguridad y privacidad de datos.
          </p>
        </div>
        <div className="flex items-start gap-3 border-l border-[#d9e5fb] px-5 py-4">
          <div className="mt-0.5">{BankIcon}</div>
          <p className="leading-5">
            <span className="block font-semibold text-[#10235d]">Tecnologia publica,</span>
            confianza ciudadana.
          </p>
        </div>
      </div>
    </section>
  );
}
