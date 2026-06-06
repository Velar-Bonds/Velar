import type { ReactNode } from 'react';
import { HeroArt } from './HeroArt';
import { VelarBrand } from './VelarBrand';

type AuthBrandingProps = {
  compact?: boolean;
};

function Feature({ icon, title, desc }: { icon: ReactNode; title: string; desc: string }) {
  return (
    <div className="flex max-w-[134px] flex-col items-center text-center xl:max-w-[144px]">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-[#dbe6ff] bg-white shadow-[0_10px_22px_rgba(37,99,235,0.08)] xl:mb-4 xl:h-14 xl:w-14">
        {icon}
      </div>
      <p className="text-sm font-semibold text-[#0f235f]">{title}</p>
      <p className="mt-1.5 text-[11px] leading-5 text-[#5b6b95] xl:mt-2 xl:text-xs">{desc}</p>
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

function DesktopBranding() {
  return (
    <section className="relative hidden min-h-[640px] overflow-hidden px-7 py-7 lg:flex lg:min-w-0 lg:flex-col lg:justify-center xl:px-10 xl:py-9">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(255,255,255,0.92),transparent_34%),radial-gradient(circle_at_30%_90%,rgba(37,99,235,0.16),transparent_42%),radial-gradient(circle_at_82%_20%,rgba(96,165,250,0.15),transparent_34%)]" />
      <div className="absolute bottom-0 left-[-8%] h-[340px] w-[760px] rounded-full bg-[radial-gradient(circle,_rgba(255,255,255,0.68),rgba(255,255,255,0))] blur-3xl xl:h-[400px] xl:w-[880px]" />
      <div className="absolute inset-y-0 right-0 w-[160px] bg-[radial-gradient(circle_at_right,_rgba(37,99,235,0.08),transparent_62%)] xl:w-[200px]" />

      <div className="relative z-10">
        <VelarBrand size="lg" />

        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#a9c8ff] bg-white/72 px-4 py-2 text-sm font-medium text-[#1f5eff] backdrop-blur-sm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 2 4 5v6c0 5 3.4 8.5 8 11 4.6-2.5 8-6 8-11V5l-8-3Z" />
          </svg>
          Transparencia que se puede verificar.
        </div>

        <h1 className="velar-brand-text mt-6 max-w-[9ch] text-[2.85rem] font-extrabold leading-[0.96] tracking-[-0.03em] text-[#10235d] xl:text-[3.25rem] 2xl:text-[3.55rem]">
          Bienvenido a
          <span className="mt-1.5 block text-[#1f63ff]">VELAR</span>
        </h1>

        <p className="mt-4 max-w-[470px] text-[15px] leading-7 text-[#53658f] xl:text-[1rem] xl:leading-8">
          La plataforma de trazabilidad verificable que fortalece la transparencia, la integridad y la
          confianza en cada decision publica.
        </p>

        <div className="mt-7 grid max-w-[520px] grid-cols-3 gap-4 xl:mt-8 xl:gap-5">
          <Feature icon={ShieldIcon} title="Verificable" desc="Evidencia inmutable y verificable." />
          <Feature icon={UsersIcon} title="Confiable" desc="Datos publicos, seguros y auditables." />
          <Feature icon={BankIcon} title="Publica" desc="Tecnologia al servicio del control ciudadano." />
        </div>
      </div>

      <div className="pointer-events-none relative z-10 mt-5 flex min-h-[180px] items-end justify-center xl:min-h-[230px]">
        <HeroArt compact={false} />
      </div>

    </section>
  );
}

function CompactBranding() {
  return (
    <section className="relative overflow-hidden rounded-[24px] border border-white/55 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.95),_rgba(236,243,255,0.88)_52%,_rgba(228,238,255,0.92))] px-5 py-5 shadow-[0_12px_30px_rgba(15,35,93,0.07)] sm:px-6 sm:py-6 lg:hidden">
      <div className="absolute inset-x-0 bottom-[-18%] h-[56%] bg-[radial-gradient(circle_at_20%_100%,rgba(37,99,235,0.12),transparent_44%),radial-gradient(circle_at_82%_24%,rgba(96,165,250,0.12),transparent_30%)]" />
      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <VelarBrand size="md" />
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#bfd2ff] bg-[#edf4ff] px-3 py-1.5 text-xs font-medium text-[#1f5eff]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 2 4 5v6c0 5 3.4 8.5 8 11 4.6-2.5 8-6 8-11V5l-8-3Z" />
            </svg>
            Transparencia verificable
          </div>
          <h1 className="velar-brand-text mt-4 text-[2rem] font-extrabold leading-[0.94] tracking-[-0.035em] text-[#10235d] sm:text-[2.3rem]">
            Bienvenido a
            <span className="block text-[#1f63ff]">VELAR</span>
          </h1>
          <p className="mt-3 max-w-[26ch] text-sm leading-6 text-[#5a6c95] sm:text-[15px]">
            Transparencia, trazabilidad y control publico en una sola plataforma.
          </p>
        </div>

        <div className="pointer-events-none -mr-3 -mt-1 shrink-0 sm:mr-0">
          <HeroArt compact />
        </div>
      </div>
    </section>
  );
}

export function AuthBranding({ compact = false }: AuthBrandingProps) {
  if (compact) return <CompactBranding />;
  return <DesktopBranding />;
}
