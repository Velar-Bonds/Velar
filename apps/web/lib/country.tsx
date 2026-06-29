'use client';
/**
 * VELAR — Contexto de país (capa adaptable en el cliente)
 * =======================================================
 * Expone el país activo y su `CountryProfile`. El país arranca desde el perfil
 * del usuario (su jurisdicción) y el selector del header lo puede cambiar para
 * explorar otros mercados en el demo. La selección manual se persiste.
 *
 * `useCountry()` tiene un fallback seguro a Costa Rica si el provider no está
 * montado, así que ningún componente crashea por usarlo fuera de contexto.
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  COUNTRY_CODES,
  COUNTRY_PROFILES,
  DEFAULT_COUNTRY,
  formatMoney,
  getCountryProfile,
  isCountryCode,
  type CountryCode,
  type CountryProfile,
} from '@velar/types';

const STORE_KEY = 'velar.country';
const MANUAL_KEY = 'velar.country.manual';

type CountryContextValue = {
  country: CountryCode;
  profile: CountryProfile;
  /** Cambia el país (selección manual del usuario, se persiste). */
  setCountry: (code: CountryCode) => void;
  /** Inicializa desde el perfil del usuario, sin pisar una selección manual. */
  seedFromProfile: (code?: string | null) => void;
  /** Todos los perfiles, para el selector. */
  profiles: CountryProfile[];
  /** Formatea un monto con la moneda del país activo. */
  money: (amount: number | null | undefined) => string;
};

const ALL_PROFILES = COUNTRY_CODES.map((c) => COUNTRY_PROFILES[c]);

function fallbackValue(): CountryContextValue {
  return {
    country: DEFAULT_COUNTRY,
    profile: getCountryProfile(DEFAULT_COUNTRY),
    setCountry: () => {},
    seedFromProfile: () => {},
    profiles: ALL_PROFILES,
    money: (n) => formatMoney(n, DEFAULT_COUNTRY),
  };
}

const CountryContext = createContext<CountryContextValue | null>(null);

export function CountryProvider({ children }: { children: ReactNode }) {
  const [country, setCountryState] = useState<CountryCode>(DEFAULT_COUNTRY);

  // En el cliente, restaurar una selección manual previa.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORE_KEY);
      if (isCountryCode(stored)) setCountryState(stored);
    } catch {
      /* localStorage no disponible */
    }
  }, []);

  const setCountry = (code: CountryCode) => {
    setCountryState(code);
    try {
      localStorage.setItem(STORE_KEY, code);
      localStorage.setItem(MANUAL_KEY, '1');
    } catch {
      /* noop */
    }
  };

  const seedFromProfile = (code?: string | null) => {
    if (!isCountryCode(code)) return;
    let manual = false;
    try {
      manual = localStorage.getItem(MANUAL_KEY) === '1';
    } catch {
      /* noop */
    }
    if (!manual) setCountryState(code);
  };

  const value: CountryContextValue = {
    country,
    profile: getCountryProfile(country),
    setCountry,
    seedFromProfile,
    profiles: ALL_PROFILES,
    money: (n) => formatMoney(n, country),
  };

  return <CountryContext.Provider value={value}>{children}</CountryContext.Provider>;
}

export function useCountry(): CountryContextValue {
  return useContext(CountryContext) ?? fallbackValue();
}
