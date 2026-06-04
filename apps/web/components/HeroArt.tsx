'use client';

import Image from 'next/image';

export function HeroArt() {
  return (
    <Image
      src="/velar-auth-hero.png"
      alt="VELAR"
      width={1024}
      height={1024}
      priority
      className="h-auto w-[340px] max-w-none object-contain mix-blend-multiply xl:w-[420px]"
    />
  );
}
