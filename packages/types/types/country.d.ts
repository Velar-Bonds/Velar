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
export declare const COUNTRY_CODES: readonly ["CR", "CO", "BR", "AR"];
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
export declare const COUNTRY_PROFILES: Record<CountryCode, CountryProfile>;
export declare const DEFAULT_COUNTRY: CountryCode;
/** Type guard: ¿es un código de país soportado? */
export declare function isCountryCode(value: unknown): value is CountryCode;
/** Devuelve el perfil del país, con fallback seguro a Costa Rica. */
export declare function getCountryProfile(code?: string | null): CountryProfile;
/** Código de moneda por país (lo usa el backend al crear bonos/solicitudes). */
export declare function currencyForCountry(code?: string | null): string;
/** Formatea un monto con la moneda y locale del país. */
export declare function formatMoney(amount: number | null | undefined, code?: string | null): string;
