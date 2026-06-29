/** Helpers para enlazar a Stellar Expert (testnet). */
const NETWORK = 'testnet';
const BASE = `https://stellar.expert/explorer/${NETWORK}`;

/** Endpoint Horizon (testnet) para lecturas read-only desde el front. */
export const HORIZON_URL = 'https://horizon-testnet.stellar.org';
/** Friendbot: fondea cuentas en testnet. */
export const FRIENDBOT_URL = 'https://friendbot.stellar.org';
/** Dashboard de estado de la red Stellar. */
export const STELLAR_DASHBOARD_URL = 'https://dashboard.stellar.org/';
/** Página para instalar la wallet Freighter. */
export const FREIGHTER_INSTALL_URL = 'https://www.freighter.app/';

/**
 * Helper unificado de enlaces a Stellar Expert (testnet). Es la fuente de verdad
 * del front; reemplaza los enlaces a stellar.expert hardcodeados por las páginas.
 */
export const txUrl = (hash: string) => `${BASE}/tx/${hash}`;
export const accountUrl = (address: string) => `${BASE}/account/${address}`;
export const assetUrl = (code: string, issuer: string) => `${BASE}/asset/${code}-${issuer}`;
export const contractUrl = (contractId: string) => `${BASE}/contract/${contractId}`;
export const networkUrl = () => BASE;

export const stellarExpert = {
  asset: assetUrl,
  account: accountUrl,
  tx: txUrl,
  contract: contractUrl,
  network: networkUrl,
};

export const shortKey = (k?: string | null, n = 4) =>
  !k ? 'Sin dato' : `${k.slice(0, n + 2)}…${k.slice(-n)}`;

/** Cuenta emisora (plataforma) de los activos de bono en testnet. */
export const PLATFORM_ISSUER = 'GDJMYOQUSNS4LWVENGQYFFUULNEYAGJBOIGAVENSRY3GI3S2P2HW2VK5';

/** Código de activo Stellar a partir del bondId (igual que el backend). */
export const assetCodeFor = (bondId: string) =>
  bondId.replace(/[^A-Za-z0-9]/g, '').slice(0, 12) || 'BOND';

/** URL del bono en Stellar Expert — usa el contrato Soroban si existe, si no el asset clásico. */
export const bondExplorerUrl = (contractId?: string | null, bondId?: string) => {
  if (contractId) return `${BASE}/contract/${contractId}`;
  if (bondId) return stellarExpert.asset(assetCodeFor(bondId), PLATFORM_ISSUER);
  return BASE;
};

/** @deprecated usar bondExplorerUrl */
export const bondAssetUrl = (bondId: string) =>
  stellarExpert.asset(assetCodeFor(bondId), PLATFORM_ISSUER);
