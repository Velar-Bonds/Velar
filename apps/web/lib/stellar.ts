/** Helpers para enlazar a Stellar Expert (testnet). */
const NETWORK = 'testnet';
const BASE = `https://stellar.expert/explorer/${NETWORK}`;

export const stellarExpert = {
  asset: (code: string, issuer: string) => `${BASE}/asset/${code}-${issuer}`,
  account: (address: string) => `${BASE}/account/${address}`,
  tx: (hash: string) => `${BASE}/tx/${hash}`,
  network: () => BASE,
};

export const shortKey = (k?: string | null, n = 4) =>
  !k ? '—' : `${k.slice(0, n + 2)}…${k.slice(-n)}`;

/** Cuenta emisora (plataforma) de los activos de bono en testnet. */
export const PLATFORM_ISSUER = 'GDJMYOQUSNS4LWVENGQYFFUULNEYAGJBOIGAVENSRY3GI3S2P2HW2VK5';

/** Código de activo Stellar a partir del bondId (igual que el backend). */
export const assetCodeFor = (bondId: string) =>
  bondId.replace(/[^A-Za-z0-9]/g, '').slice(0, 12) || 'BOND';

/** URL del activo del bono en Stellar Expert. */
export const bondAssetUrl = (bondId: string) =>
  stellarExpert.asset(assetCodeFor(bondId), PLATFORM_ISSUER);
