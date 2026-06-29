'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  getAddress,
  getNetwork,
  isConnected,
  requestAccess,
  signTransaction as freighterSign,
} from '@stellar/freighter-api';

const STORAGE_KEY = 'velar.wallet.publicKey';

/** Red esperada por VELAR. Freighter devuelve 'TESTNET' | 'PUBLIC' | 'FUTURENET' ... */
export const EXPECTED_NETWORK = 'TESTNET';
export const TESTNET_PASSPHRASE = 'Test SDF Network ; September 2015';

export type WalletState = {
  /** Llave pública (G...) de la wallet conectada, o null. */
  publicKey: string | null;
  isConnected: boolean;
  /** true mientras corre connect(). */
  connecting: boolean;
  /** Red reportada por Freighter ('TESTNET', 'PUBLIC', ...). */
  network: string | null;
  networkPassphrase: string | null;
  /** ¿La extensión Freighter está instalada/disponible en el navegador? */
  available: boolean | null;
  /** true si está conectada pero en una red distinta a TESTNET. */
  wrongNetwork: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  /** Firma un XDR con Freighter (testnet). Devuelve el XDR firmado. */
  signXdr: (xdr: string) => Promise<string>;
};

const WalletContext = createContext<WalletState | null>(null);

function readError(res: { error?: unknown } | undefined): string | null {
  const err = res?.error as { message?: string } | string | undefined;
  if (!err) return null;
  if (typeof err === 'string') return err;
  return err.message ?? 'Error de Freighter';
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [network, setNetwork] = useState<string | null>(null);
  const [networkPassphrase, setNetworkPassphrase] = useState<string | null>(null);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [connecting, setConnecting] = useState(false);

  const refreshNetwork = useCallback(async () => {
    try {
      const net = await getNetwork();
      if (!readError(net)) {
        setNetwork(net.network ?? null);
        setNetworkPassphrase(net.networkPassphrase ?? null);
      }
    } catch {
      /* Freighter no disponible */
    }
  }, []);

  // Al montar: detectar Freighter y restaurar la sesión previa (si la había).
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const conn = await isConnected();
        const installed = !readError(conn) && Boolean(conn.isConnected);
        if (!active) return;
        setAvailable(installed);
        if (!installed) return;

        const stored = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
        if (stored) {
          // Intentar recuperar la dirección sin re-pedir permiso (si ya está autorizada).
          const addr = await getAddress();
          if (!active) return;
          if (!readError(addr) && addr.address) {
            setPublicKey(addr.address);
            await refreshNetwork();
          } else {
            window.localStorage.removeItem(STORAGE_KEY);
          }
        }
      } catch {
        if (active) setAvailable(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [refreshNetwork]);

  const connect = useCallback(async () => {
    setConnecting(true);
    try {
      const conn = await isConnected();
      const installed = !readError(conn) && Boolean(conn.isConnected);
      setAvailable(installed);
      if (!installed) {
        throw new Error('FREIGHTER_NOT_INSTALLED');
      }

      const access = await requestAccess();
      const accessErr = readError(access);
      if (accessErr || !access.address) {
        throw new Error(accessErr ?? 'No se pudo obtener la dirección de Freighter');
      }
      setPublicKey(access.address);
      if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, access.address);
      await refreshNetwork();
    } finally {
      setConnecting(false);
    }
  }, [refreshNetwork]);

  const disconnect = useCallback(() => {
    setPublicKey(null);
    setNetwork(null);
    setNetworkPassphrase(null);
    if (typeof window !== 'undefined') window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  const signXdr = useCallback(
    async (xdr: string) => {
      const res = await freighterSign(xdr, {
        networkPassphrase: TESTNET_PASSPHRASE,
        address: publicKey ?? undefined,
      });
      const err = readError(res);
      if (err || !res.signedTxXdr) throw new Error(err ?? 'No se pudo firmar la transacción');
      return res.signedTxXdr;
    },
    [publicKey],
  );

  const value = useMemo<WalletState>(
    () => ({
      publicKey,
      isConnected: Boolean(publicKey),
      connecting,
      network,
      networkPassphrase,
      available,
      wrongNetwork: Boolean(publicKey && network && network !== EXPECTED_NETWORK),
      connect,
      disconnect,
      signXdr,
    }),
    [publicKey, connecting, network, networkPassphrase, available, connect, disconnect, signXdr],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletState {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet debe usarse dentro de <WalletProvider>');
  return ctx;
}
