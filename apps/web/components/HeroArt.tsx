'use client';

import Image from 'next/image';

export function HeroArt({ compact = false }: { compact?: boolean }) {
  return (
    <Image
      src="/velar-auth-hero.png"
      alt="VELAR"
      width={1024}
      height={1024}
      priority
      quality={100}
      sizes={compact ? '(max-width: 640px) 180px, 220px' : '(max-width: 1024px) 280px, (max-width: 1536px) 340px, 390px'}
      className={`h-auto max-w-none object-contain mix-blend-multiply ${
        compact
          ? 'w-[150px] drop-shadow-[0_20px_34px_rgba(31,99,255,0.18)] sm:w-[185px]'
          : 'w-[270px] drop-shadow-[0_32px_56px_rgba(31,99,255,0.18)] xl:w-[350px] 2xl:w-[400px]'
      }`}
    />
  );
}
