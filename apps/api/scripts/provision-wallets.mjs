// ============================================================
// VELAR — Aprovisionamiento de wallets Stellar (TESTNET)
// ============================================================
// Custodia asistida para demo: genera keypairs de testnet para la plataforma
// y para los usuarios demo, los fondea con XLM (Friendbot), agrega trustline
// de USDC, guarda las llaves en apps/api/.stellar-wallets.json (gitignored) y
// publica las direcciones públicas en profiles.stellar_wallet.
//
// Uso:  npm run provision:wallets   (desde apps/api)
// Idempotente: si ya existe .stellar-wallets.json, reutiliza las llaves.
// ============================================================

import { WebSocket } from 'ws';
if (typeof globalThis.WebSocket === 'undefined') globalThis.WebSocket = WebSocket;

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  Keypair, Horizon, TransactionBuilder, Operation, Asset, Networks, BASE_FEE,
} from '@stellar/stellar-sdk';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WALLETS_FILE = path.join(__dirname, '..', '.stellar-wallets.json');

const HORIZON = 'https://horizon-testnet.stellar.org';
const FRIENDBOT = 'https://friendbot.stellar.org';
const USDC = new Asset('USDC', 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5');
const server = new Horizon.Server(HORIZON);

// Wallets a crear: plataforma + roles que participan en el escrow.
const NAMES = ['platform', 'comprador', 'recomprador', 'validador', 'emisor'];
const EMAIL_BY_NAME = {
  comprador: 'comprador@velar.cr',
  recomprador: 'recomprador@velar.cr',
  validador: 'validador@velar.cr',
  emisor: 'emisor@velar.cr',
};

function loadOrCreateKeys() {
  if (fs.existsSync(WALLETS_FILE)) {
    console.log('= reutilizando llaves de .stellar-wallets.json');
    return JSON.parse(fs.readFileSync(WALLETS_FILE, 'utf8'));
  }
  const out = {};
  for (const name of NAMES) {
    const kp = Keypair.random();
    out[name] = { publicKey: kp.publicKey(), secret: kp.secret() };
  }
  fs.writeFileSync(WALLETS_FILE, JSON.stringify(out, null, 2));
  console.log('+ llaves generadas y guardadas en .stellar-wallets.json');
  return out;
}

async function isFunded(pk) {
  try { await server.loadAccount(pk); return true; } catch { return false; }
}

async function fundWithFriendbot(pk) {
  const res = await fetch(`${FRIENDBOT}?addr=${encodeURIComponent(pk)}`);
  if (!res.ok && res.status !== 400) throw new Error(`friendbot ${res.status}`);
  // 400 suele significar "ya fondeada".
}

async function hasUsdcTrustline(pk) {
  const acc = await server.loadAccount(pk);
  return acc.balances.some(
    (b) => b.asset_code === 'USDC' && b.asset_issuer === USDC.getIssuer(),
  );
}

async function addUsdcTrustline(secret) {
  const kp = Keypair.fromSecret(secret);
  const acc = await server.loadAccount(kp.publicKey());
  const tx = new TransactionBuilder(acc, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
    .addOperation(Operation.changeTrust({ asset: USDC }))
    .setTimeout(60)
    .build();
  tx.sign(kp);
  await server.submitTransaction(tx);
}

async function main() {
  console.log('🌟 VELAR — aprovisionando wallets Stellar (TESTNET)\n');
  const keys = loadOrCreateKeys();

  for (const name of NAMES) {
    const { publicKey, secret } = keys[name];
    process.stdout.write(`• ${name.padEnd(12)} ${publicKey.slice(0, 8)}… `);

    if (!(await isFunded(publicKey))) {
      await fundWithFriendbot(publicKey);
      // pequeña espera a que Horizon registre la cuenta
      await new Promise((r) => setTimeout(r, 1500));
      process.stdout.write('fondeada(XLM) ');
    } else process.stdout.write('ya-fondeada ');

    try {
      if (!(await hasUsdcTrustline(publicKey))) {
        await addUsdcTrustline(secret);
        process.stdout.write('+trustline(USDC)');
      } else process.stdout.write('trustline-ok');
    } catch (e) {
      process.stdout.write(`trustline-ERR(${e.message?.slice(0, 30)})`);
    }
    process.stdout.write('\n');
  }

  // Publicar direcciones públicas en profiles + platform address en consola.
  const url = process.env.SUPABASE_URL, srk = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && srk) {
    const db = createClient(url, srk, { auth: { persistSession: false } });
    for (const [name, email] of Object.entries(EMAIL_BY_NAME)) {
      const { data: prof } = await db.from('profiles').select('id').eq('email', email).maybeSingle();
      if (prof) await db.from('profiles').update({ stellar_wallet: keys[name].publicKey }).eq('id', prof.id);
    }
    console.log('\n✅ Direcciones públicas guardadas en profiles.stellar_wallet');
  } else {
    console.log('\n⚠️  Sin SUPABASE_*; no se actualizaron los perfiles.');
  }

  console.log('\n📌 TRUSTLESS_WORK_PLATFORM_ADDRESS=' + keys.platform.publicKey);
  console.log('   (agregalo a apps/api/.env)\n');
}

main().catch((e) => { console.error('❌ provision falló:', e.message ?? e); process.exit(1); });
