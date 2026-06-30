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
  KitEventType,
  Networks,
  StellarWalletsKit,
} from '@creit.tech/stellar-wallets-kit';
import { defaultModules } from '@creit.tech/stellar-wallets-kit/modules/utils';

const STORAGE_KEY = 'velar.wallet.publicKey';

export const EXPECTED_NETWORK = 'TESTNET';
export const TESTNET_PASSPHRASE = 'Test SDF Network ; September 2015';

let kitInitialized = false;

export type WalletState = {
  publicKey: string | null;
  isConnected: boolean;
  connecting: boolean;
  network: string | null;
  networkPassphrase: string | null;
  available: boolean | null;
  wrongNetwork: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  signXdr: (xdr: string) => Promise<string>;
};

const WalletContext = createContext<WalletState | null>(null);

function ensureKit() {
  if (kitInitialized) return;
  StellarWalletsKit.init({
    modules: defaultModules(),
    network: Networks.TESTNET,
    authModal: {
      showInstallLabel: true,
      hideUnsupportedWallets: false,
    },
  });
  kitInitialized = true;
}

function networkLabel(passphrase: string | null | undefined) {
  if (passphrase === Networks.TESTNET) return 'TESTNET';
  if (passphrase === Networks.PUBLIC) return 'PUBLIC';
  if (passphrase === Networks.FUTURENET) return 'FUTURENET';
  if (passphrase === Networks.SANDBOX) return 'SANDBOX';
  if (passphrase === Networks.STANDALONE) return 'STANDALONE';
  return null;
}

function errorMessage(error: unknown, fallback = 'No se pudo conectar la wallet') {
  if (error instanceof Error && error.message) return error.message;
  const kitError = error as { message?: unknown };
  if (typeof kitError?.message === 'string' && kitError.message.trim()) return kitError.message;
  return fallback;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [network, setNetwork] = useState<string | null>(null);
  const [networkPassphrase, setNetworkPassphrase] = useState<string | null>(null);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [connecting, setConnecting] = useState(false);

  const setWalletState = useCallback((address: string | null, passphrase?: string | null) => {
    setPublicKey(address);
    if (typeof passphrase !== 'undefined') {
      setNetworkPassphrase(passphrase);
      setNetwork(networkLabel(passphrase));
    }
    if (typeof window !== 'undefined') {
      if (address) window.localStorage.setItem(STORAGE_KEY, address);
      else window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const refreshNetwork = useCallback(async () => {
    ensureKit();
    try {
      const net = await StellarWalletsKit.getNetwork();
      setNetwork(net.network || networkLabel(net.networkPassphrase));
      setNetworkPassphrase(net.networkPassphrase ?? null);
    } catch {
      setNetwork(networkLabel(TESTNET_PASSPHRASE));
      setNetworkPassphrase(TESTNET_PASSPHRASE);
    }
  }, []);

  useEffect(() => {
    let active = true;
    ensureKit();

    const unsubscribeState = StellarWalletsKit.on(KitEventType.STATE_UPDATED, (event) => {
      if (!active) return;
      setWalletState(event.payload.address ?? null, event.payload.networkPassphrase ?? null);
    });

    const unsubscribeDisconnect = StellarWalletsKit.on(KitEventType.DISCONNECT, () => {
      if (!active) return;
      setWalletState(null, null);
    });

    (async () => {
      try {
        const supportedWallets = await StellarWalletsKit.refreshSupportedWallets();
        if (!active) return;
        setAvailable(supportedWallets.length > 0);

        const stored = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
        if (stored) {
          setWalletState(stored, TESTNET_PASSPHRASE);
          await refreshNetwork();
        }
      } catch {
        if (active) setAvailable(false);
      }
    })();

    return () => {
      active = false;
      unsubscribeState();
      unsubscribeDisconnect();
    };
  }, [refreshNetwork, setWalletState]);

  const connect = useCallback(async () => {
    ensureKit();
    setConnecting(true);
    try {
      const { address } = await StellarWalletsKit.authModal();
      if (!address) throw new Error('La wallet no devolvio una direccion publica');
      setAvailable(true);
      setWalletState(address, TESTNET_PASSPHRASE);
      await refreshNetwork();
    } catch (error) {
      throw new Error(errorMessage(error));
    } finally {
      setConnecting(false);
    }
  }, [refreshNetwork, setWalletState]);

  const disconnect = useCallback(() => {
    ensureKit();
    setWalletState(null, null);
    StellarWalletsKit.disconnect().catch(() => undefined);
  }, [setWalletState]);

  const signXdr = useCallback(
    async (xdr: string) => {
      ensureKit();
      let address = publicKey;
      if (!address) {
        const result = await StellarWalletsKit.authModal();
        address = result.address;
        if (!address) throw new Error('La wallet no devolvio una direccion publica');
        setWalletState(address, TESTNET_PASSPHRASE);
      }

      const result = await StellarWalletsKit.signTransaction(xdr, {
        networkPassphrase: TESTNET_PASSPHRASE,
        address,
      });
      if (!result.signedTxXdr) throw new Error('No se pudo firmar la transaccion');
      return result.signedTxXdr;
    },
    [publicKey, setWalletState],
  );

  const value = useMemo<WalletState>(
    () => ({
      publicKey,
      isConnected: Boolean(publicKey),
      connecting,
      network,
      networkPassphrase,
      available,
      wrongNetwork: Boolean(publicKey && networkPassphrase && networkPassphrase !== TESTNET_PASSPHRASE),
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
