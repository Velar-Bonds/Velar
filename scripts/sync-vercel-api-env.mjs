#!/usr/bin/env node
/** Sincroniza env de apps/api → Vercel (solo production, más rápido). */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const apiDir = path.join(root, 'apps/api');
const project = process.argv[2] ?? 'velar-api';
const target = process.argv[3] ?? 'production';
const vercelBin = path.join(root, 'node_modules', '.bin', 'vercel');

function parseEnv(file) {
  const out = {};
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i <= 0) continue;
    out[t.slice(0, i)] = t.slice(i + 1);
  }
  return out;
}

function runVercel(args, input) {
  return spawnSync(vercelBin, args, {
    cwd: root,
    input,
    stdio: input ? ['pipe', 'pipe', 'pipe'] : 'inherit',
  });
}

function addEnv(name, value) {
  if (!value) return;
  runVercel(['env', 'rm', name, target, '--yes']);
  const r = runVercel(['env', 'add', name, target], value);
  if (r.status !== 0) console.error(`fail ${name}:`, r.stderr?.toString());
  else console.log(`✓ ${name}`);
}

const local = parseEnv(path.join(apiDir, '.env'));
const wallets = JSON.stringify(JSON.parse(fs.readFileSync(path.join(apiDir, '.stellar-wallets.json'), 'utf8')));
const webUrl = 'https://velar-web.vercel.app';

runVercel(['link', '--yes', '--project', project]);

const vars = {
  SUPABASE_URL: local.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: local.SUPABASE_SERVICE_ROLE_KEY,
  TRUSTLESS_WORK_API_KEY: local.TRUSTLESS_WORK_API_KEY,
  TRUSTLESS_WORK_API_URL: local.TRUSTLESS_WORK_API_URL ?? 'https://dev.api.trustlesswork.com',
  TRUSTLESS_WORK_PLATFORM_ADDRESS: local.TRUSTLESS_WORK_PLATFORM_ADDRESS,
  STELLAR_NETWORK: 'testnet',
  STELLAR_HORIZON_URL: 'https://horizon-testnet.stellar.org',
  STELLAR_RPC_URL: 'https://soroban-testnet.stellar.org',
  STELLAR_ENABLE_FRIENDBOT: 'true',
  STELLAR_WALLETS_JSON: wallets,
  SOROBAN_VELAR_BOND_WASM_HASH: local.SOROBAN_VELAR_BOND_WASM_HASH ?? '',
  SOROBAN_TSE_ADDRESS: local.SOROBAN_TSE_ADDRESS ?? '',
  WEB_URL: webUrl,
  CORS_ORIGINS: [webUrl, 'https://velar-web-josueazcs-projects.vercel.app', 'https://velar-omega.vercel.app'].join(','),
  THROTTLE_TTL: '60000',
  THROTTLE_LIMIT: '100',
};

console.log(`→ ${project} / ${target}`);
for (const [k, v] of Object.entries(vars)) addEnv(k, v);
