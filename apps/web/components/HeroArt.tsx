'use client';

/**
 * Hero del login: el "V de cristal" (render real en /velar-hero.png).
 * mix-blend-multiply funde el fondo blanco de la imagen con el panel.
 */
export function HeroArt() {
  return (
    <img
      src="/velar-hero.png"
      alt="VELAR"
      className="w-[540px] max-w-[88%] object-contain mix-blend-multiply"
    />
  );
}

function _HeroSvgFallback() {
  return (
    <svg width="520" height="400" viewBox="0 0 520 400" fill="none" aria-hidden className="max-w-[85%]">
      <defs>
        <linearGradient id="glassV" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor="#EAF1FF" />
          <stop offset="0.45" stopColor="#BAD2FF" />
          <stop offset="1" stopColor="#7FA8F5" />
        </linearGradient>
        <linearGradient id="bevel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#CFE0FF" />
          <stop offset="0.5" stopColor="#9CC0FF" />
          <stop offset="1" stopColor="#6E97E8" />
        </linearGradient>
        <radialGradient id="sphere" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.4" stopColor="#CFE0FF" />
          <stop offset="1" stopColor="#7FA8F5" />
        </radialGradient>
        <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>

      {/* sombra al piso */}
      <ellipse cx="260" cy="330" rx="170" ry="26" fill="#8FB0E8" opacity="0.22" filter="url(#soft)" />

      {/* anillo orbital (tubo 3D: dos elipses) */}
      <g transform="rotate(-13 260 250)">
        <ellipse cx="260" cy="250" rx="185" ry="58" stroke="url(#ring)" strokeWidth="16" opacity="0.9" />
        <ellipse cx="260" cy="246" rx="185" ry="58" stroke="#FFFFFF" strokeWidth="4" opacity="0.5" />
      </g>

      {/* V de cristal */}
      <g>
        <path d="M150 70 L262 300 L300 300 L188 70 Z" fill="url(#glassV)" />
        <path d="M372 70 L262 300 L300 300 L410 70 Z" fill="url(#glassV)" />
        <path d="M150 70 L188 70 L176 96 L162 96 Z" fill="url(#bevel)" />
        <path d="M372 70 L410 70 L398 96 L384 96 Z" fill="url(#bevel)" />
        <path d="M150 70 L262 300 L300 300 L188 70 Z" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.6" fill="none" />
        <path d="M372 70 L262 300 L300 300 L410 70 Z" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.6" fill="none" />
      </g>

      {/* esfera */}
      <circle cx="430" cy="300" r="26" fill="url(#sphere)" />
      <circle cx="421" cy="291" r="7" fill="#FFFFFF" opacity="0.85" />
    </svg>
  );
}
