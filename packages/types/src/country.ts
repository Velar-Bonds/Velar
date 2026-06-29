/**
 * VELAR — Perfiles de país (LATAM)
 * ================================
 * El núcleo de Stellar (tokenización + escrow + auditoría) es idéntico en todos
 * los países. Lo que cambia por jurisdicción —autoridad electoral, instrumento
 * financiero, moneda, reglas— vive acá, en un `CountryProfile`.
 *
 * Esta es la "capa adaptable": el backend la usa para moneda/validación y el
 * frontend para todos los textos, badges y formato. Agregar un país nuevo es
 * agregar un registro en COUNTRY_PROFILES, no reescribir la app.
 *
 * Fuentes (contexto regulatorio, mid-2026):
 *   CR — Deuda política: el Estado reembolsa a los partidos; éstos emiten bonos
 *        (certificados de cesión) negociables. Autoridad: TSE.
 *   CO — Reposición de votos: reembolso estatal post-electoral ($8.613/voto 2026,
 *        umbral 4%). Autoridad: CNE. La "cesión" del derecho de reposición es el
 *        análogo directo del bono costarricense.
 *   BR — Fundo Especial de Financiamento de Campanha (FEFC / "fundão"): ~R$4,9 bi
 *        para 2026, repartido por el TSE. Donaciones de empresas prohibidas (STF
 *        2015). Autoridad: TSE.
 *   AR — Modelo mixto (Ley 27.504): Fondo Partidario + aportes privados, todo por
 *        una cuenta única de campaña. Autoridad: Cámara Nacional Electoral.
 */

export const COUNTRY_CODES = ['CR', 'CO', 'BR', 'AR'] as const;
export type CountryCode = (typeof COUNTRY_CODES)[number];

/** Tipo de instrumento financiero por país (cambia el flujo conceptual). */
export type InstrumentType = 'bond' | 'cession' | 'disbursement' | 'contribution';

/**
 * 'live'       → flujo completo soportado y demostrable.
 * 'configured' → perfil configurado (UI se adapta), flujo completo en roadmap.
 */
export type CountryStatus = 'live' | 'configured';

export interface CountryProfile {
  code: CountryCode;
  name: string;
  /** Emoji de bandera, para selector y badges. */
  flag: string;
  /** Gentilicio, para copy ("inversores colombianos"). */
  demonym: string;

  authority: {
    /** Sigla corta usada en la UI donde antes decía "TSE". */
    code: string;
    /** Nombre completo de la autoridad electoral. */
    name: string;
    /** Rol en una línea, para tooltips. */
    role: string;
  };

  instrument: {
    type: InstrumentType;
    /** Singular, p. ej. "Bono de deuda política". */
    label: string;
    /** Plural, p. ej. "Bonos de deuda política". */
    labelPlural: string;
    /** Una línea explicando qué es el instrumento en ese país. */
    description: string;
  };

  currency: {
    /** ISO 4217: CRC / COP / BRL / ARS. */
    code: string;
    /** Símbolo para mostrar: ₡ / $ / R$ / $. */
    symbol: string;
    /** Locale para Intl.NumberFormat: es-CR / es-CO / pt-BR / es-AR. */
    locale: string;
  };

  /** Reglas específicas del mecanismo de financiamiento (informativas en la UI). */
  rules?: {
    voteThresholdPct?: number;
    valuePerVote?: number;
    valuePerVoteCurrency?: string;
    note?: string;
  };

  status: CountryStatus;

  /** Blurb regulatorio para el pitch y la ficha de país en la UI. */
  context: string;
}

export const COUNTRY_PROFILES: Record<CountryCode, CountryProfile> = {
  CR: {
    code: 'CR',
    name: 'Costa Rica',
    flag: '🇨🇷',
    demonym: 'costarricense',
    authority: {
      code: 'TSE',
      name: 'Tribunal Supremo de Elecciones',
      role: 'Emite, supervisa, audita y puede congelar los bonos políticos.',
    },
    instrument: {
      type: 'bond',
      label: 'Bono de deuda política',
      labelPlural: 'Bonos de deuda política',
      description:
        'El Estado reembolsa a los partidos tras la elección; éstos emiten bonos negociables (certificados de cesión) para financiarse antes.',
    },
    currency: { code: 'CRC', symbol: '₡', locale: 'es-CR' },
    status: 'live',
    context:
      'En Costa Rica la "deuda política" es un reembolso estatal post-electoral. Los partidos emiten bonos negociables sobre ese derecho a cobro futuro — el instrumento que VELAR tokeniza.',
  },

  CO: {
    code: 'CO',
    name: 'Colombia',
    flag: '🇨🇴',
    demonym: 'colombiano',
    authority: {
      code: 'CNE',
      name: 'Consejo Nacional Electoral',
      role: 'Fija topes, audita gastos y desembolsa la reposición de votos.',
    },
    instrument: {
      type: 'cession',
      label: 'Cesión de reposición de votos',
      labelPlural: 'Cesiones de reposición de votos',
      description:
        'El Estado reembolsa por voto válido tras la elección. La campaña cede ese derecho de reposición futura para financiarse antes — hoy vía créditos opacos.',
    },
    currency: { code: 'COP', symbol: '$', locale: 'es-CO' },
    rules: {
      voteThresholdPct: 4,
      valuePerVote: 8613,
      valuePerVoteCurrency: 'COP',
      note: 'Umbral 4% de votos válidos · $8.613 COP por voto (2026).',
    },
    status: 'live',
    context:
      'Colombia tiene la misma estructura que Costa Rica: reembolso estatal post-electoral (reposición de votos). Tokenizar la cesión de ese derecho da trazabilidad donde hoy solo hay créditos bancarios opacos.',
  },

  BR: {
    code: 'BR',
    name: 'Brasil',
    flag: '🇧🇷',
    demonym: 'brasileño',
    authority: {
      code: 'TSE',
      name: 'Tribunal Superior Eleitoral',
      role: 'Reparte el Fundo Eleitoral (FEFC) y fiscaliza las cuentas de campaña.',
    },
    instrument: {
      type: 'disbursement',
      label: 'Cota do Fundo Eleitoral',
      labelPlural: 'Cotas do Fundo Eleitoral',
      description:
        'El financiamiento es público vía FEFC (~R$4,9 bi en 2026). Tokenizar el desembolso del fondo da trazabilidad pública de cada real que sale del Tesoro.',
    },
    currency: { code: 'BRL', symbol: 'R$', locale: 'pt-BR' },
    rules: {
      note: 'Donaciones de empresas prohibidas (STF, 2015). FEFC ~R$4,9 bi en 2026.',
    },
    status: 'configured',
    context:
      'Brasil no usa bonos negociables: el dinero es público (FEFC). El ángulo es la trazabilidad del desembolso del fondo y el fin del "caixa dois" — el mismo núcleo on-chain de VELAR.',
  },

  AR: {
    code: 'AR',
    name: 'Argentina',
    flag: '🇦🇷',
    demonym: 'argentino',
    authority: {
      code: 'CNE',
      name: 'Cámara Nacional Electoral',
      role: 'Controla la cuenta única de campaña y la rendición de cuentas.',
    },
    instrument: {
      type: 'contribution',
      label: 'Aporte de campaña',
      labelPlural: 'Aportes de campaña',
      description:
        'Modelo mixto (Ley 27.504): Fondo Partidario + aportes privados, todo por una cuenta única. Tokenizar el aporte lo hace verificable en tiempo real.',
    },
    currency: { code: 'ARS', symbol: '$', locale: 'es-AR' },
    rules: {
      note: 'Ley 27.504: financiamiento mixto canalizado por una cuenta única de campaña.',
    },
    status: 'configured',
    context:
      'Argentina canaliza el financiamiento por una cuenta única, con rendición de cuentas 90 días después. VELAR fuerza que cada aporte sea verificable on-chain en el momento, no en un informe tardío.',
  },
};

export const DEFAULT_COUNTRY: CountryCode = 'CR';

/** Type guard: ¿es un código de país soportado? */
export function isCountryCode(value: unknown): value is CountryCode {
  return typeof value === 'string' && (COUNTRY_CODES as readonly string[]).includes(value);
}

/** Devuelve el perfil del país, con fallback seguro a Costa Rica. */
export function getCountryProfile(code?: string | null): CountryProfile {
  if (isCountryCode(code)) return COUNTRY_PROFILES[code];
  return COUNTRY_PROFILES[DEFAULT_COUNTRY];
}

/** Código de moneda por país (lo usa el backend al crear bonos/solicitudes). */
export function currencyForCountry(code?: string | null): string {
  return getCountryProfile(code).currency.code;
}

/** Formatea un monto con la moneda y locale del país. */
export function formatMoney(amount: number | null | undefined, code?: string | null): string {
  const profile = getCountryProfile(code);
  if (amount == null || Number.isNaN(Number(amount))) return '—';
  try {
    return new Intl.NumberFormat(profile.currency.locale, {
      style: 'currency',
      currency: profile.currency.code,
      maximumFractionDigits: 0,
    }).format(Number(amount));
  } catch {
    return `${profile.currency.symbol}${Number(amount).toLocaleString()}`;
  }
}
