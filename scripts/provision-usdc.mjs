/**
 * Provisiona USDC testnet en la wallet platform para que pueda fondear compradores.
 * Usa el faucet de Circle para testnet de Stellar.
 * Correr una sola vez: node scripts/provision-usdc.mjs
 */
import { readFileSync } from 'fs';
import pkg from '@stellar/stellar-sdk';
const { Keypair, TransactionBuilder, Asset, Operation, Networks, BASE_FEE, Memo, Horizon } = pkg;
const { Server } = Horizon;

const USDC_ISSUER = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
const HORIZON = 'https://horizon-testnet.stellar.org';
const server = new Server(HORIZON);
const usdc = new Asset('USDC', USDC_ISSUER);

const wallets = JSON.parse(readFileSync('./apps/api/.stellar-wallets.json', 'utf8'));
const platform = wallets['platform'];
if (!platform) { console.error('No encontré wallet platform'); process.exit(1); }

const kp = Keypair.fromSecret(platform.secret);
console.log('Platform wallet:', kp.publicKey());

// 1. Agregar trustline USDC a la cuenta platform
async function ensureUsdcTrustline() {
  const acc = await server.loadAccount(kp.publicKey());
  const hasTrustline = acc.balances.some(b => b.asset_code === 'USDC' && b.asset_issuer === USDC_ISSUER);
  if (hasTrustline) {
    const bal = acc.balances.find(b => b.asset_code === 'USDC');
    console.log('Trustline USDC ya existe, balance:', bal.balance);
    return;
  }
  console.log('Agregando trustline USDC a platform...');
  const tx = new TransactionBuilder(acc, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
    .addOperation(Operation.changeTrust({ asset: usdc, limit: '1000000' }))
    .setTimeout(60).build();
  tx.sign(kp);
  const res = await server.submitTransaction(tx);
  console.log('Trustline OK:', res.hash);
}

// 2. Pedir USDC del faucet de Circle testnet
async function requestUsdcFromFaucet() {
  console.log('Solicitando USDC del faucet de Circle...');
  const res = await fetch('https://faucet.circle.com/api/faucet', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      address: kp.publicKey(),
      blockchain: 'stellar-testnet',
    }),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error('Faucet error:', res.status, text.slice(0, 300));
    console.log('\nAlternativa manual:');
    console.log(`  Ve a https://faucet.circle.com y pide USDC para: ${kp.publicKey()}`);
    return false;
  }
  console.log('Faucet response:', text.slice(0, 200));
  return true;
}

async function main() {
  await ensureUsdcTrustline();
  await requestUsdcFromFaucet();

  // Verificar balance final
  await new Promise(r => setTimeout(r, 5000));
  const acc = await server.loadAccount(kp.publicKey());
  const usdcBal = acc.balances.find(b => b.asset_code === 'USDC');
  console.log('\nBalance USDC platform:', usdcBal?.balance ?? '0');
}

main().catch(console.error);
