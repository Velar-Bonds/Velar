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
          ? 'w-[150px] velar-hero-drop-shadow-compact sm:w-[185px]'
          : 'w-[240px] velar-hero-drop-shadow xl:w-[300px] 2xl:w-[340px]'
      }`}
    />
  );
}
