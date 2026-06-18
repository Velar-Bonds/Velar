import { Networks } from '@stellar/stellar-sdk';

/**
 * Configuración compartida de red Stellar/Soroban.
 *
 * Antes cada servicio (stellar-bond, soroban-bond, wallet, trustless-work,
 * explorer) definía su propia red, URLs de RPC/Horizon y construía los links de
 * stellar.expert a mano. Esto centraliza todo en un solo lugar y elimina la
 * inconsistencia donde soroban-bond quedaba siempre fijo en testnet.
 *
 * La red se controla con STELLAR_NETWORK ('testnet' | 'mainnet'); por defecto
 * testnet, así que el comportamiento por defecto no cambia.
 */
export type StellarNetwork = 'testnet' | 'mainnet';

export const STELLAR_NETWORK: StellarNetwork =
  process.env.STELLAR_NETWORK === 'mainnet' ? 'mainnet' : 'testnet';

/** Passphrase de red para firmar/parsear transacciones. */
export const NETWORK_PASSPHRASE =
  STELLAR_NETWORK === 'mainnet' ? Networks.PUBLIC : Networks.TESTNET;

/** Endpoint Horizon (Stellar Classic). */
export const HORIZON_URL =
  process.env.STELLAR_HORIZON_URL ??
  (STELLAR_NETWORK === 'mainnet'
    ? 'https://horizon.stellar.org'
    : 'https://horizon-testnet.stellar.org');

/** Endpoint RPC de Soroban (smart contracts). */
export const SOROBAN_RPC_URL =
  process.env.SOROBAN_RPC_URL ??
  (STELLAR_NETWORK === 'mainnet'
    ? 'https://mainnet.sorobanrpc.com'
    : 'https://soroban-testnet.stellar.org');

/** Segmento de red usado por stellar.expert ('public' en mainnet). */
export const EXPLORER_NETWORK: 'public' | 'testnet' =
  STELLAR_NETWORK === 'mainnet' ? 'public' : 'testnet';

const EXPLORER_BASE = `https://stellar.expert/explorer/${EXPLORER_NETWORK}`;

/** Link a una cuenta en el explorador. */
export const explorerAccountUrl = (address: string): string =>
  `${EXPLORER_BASE}/account/${address}`;

/** Link a un asset (código-emisor) en el explorador. */
export const explorerAssetUrl = (code: string, issuer: string): string =>
  `${EXPLORER_BASE}/asset/${code}-${issuer}`;

/** Link a un contrato Soroban en el explorador. */
export const explorerContractUrl = (contractId: string): string =>
  `${EXPLORER_BASE}/contract/${contractId}`;

/** Link a una transacción en el explorador. */
export const explorerTxUrl = (txHash: string): string =>
  `${EXPLORER_BASE}/tx/${txHash}`;

/**
 * Errores tipados que emite el contrato Soroban VelarBond.
 * Fuente de verdad: contracts/velar-bond/src/lib.rs (enum Error, repr u32).
 */
export const VELAR_BOND_CONTRACT_ERRORS: Record<number, string> = {
  1: 'El bono ya fue inicializado',
  2: 'El bono no ha sido inicializado',
  3: 'La cuenta no es el dueño del bono',
  4: 'La cuenta no es el TSE autorizado',
  5: 'Estado del bono inválido para esta operación',
  6: 'El bono está congelado',
  7: 'El nuevo dueño es igual al actual',
};

/**
 * Traduce un fallo de contrato Soroban a un mensaje legible. Soroban reporta los
 * errores de contrato como `Error(Contract, #n)`; mapeamos `n` a la tabla de
 * VelarBond. Si no reconoce el código, devuelve la representación cruda.
 */
export function describeContractError(raw: unknown): string {
  const text = typeof raw === 'string' ? raw : JSON.stringify(raw);
  const match = /#(\d+)/.exec(text ?? '');
  if (match) {
    const code = Number(match[1]);
    const known = VELAR_BOND_CONTRACT_ERRORS[code];
    if (known) return `${known} (contract error #${code})`;
  }
  return text ?? 'Error de contrato desconocido';
}
